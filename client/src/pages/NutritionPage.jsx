import { useRef, useState } from 'react';
import { AnimatePresence, m } from 'motion/react';
import { Camera, Flame, ImageUp, Info, RotateCcw, ScanSearch, Sparkles, UtensilsCrossed } from 'lucide-react';
import { analyzeMealPhoto } from '../api/nutrition.js';
import MacroBreakdown from '../components/nutrition/MacroBreakdown.jsx';
import Button from '../components/ui/Button.jsx';
import Card from '../components/ui/Card.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import ErrorMessage from '../components/ErrorMessage.jsx';
import PageHeader from '../components/ui/PageHeader.jsx';
import { AnimatedNumber } from '../components/ui/motion.jsx';
import { shrinkImage } from '../utils/image.js';

// "Food scanner": take or choose a photo of a meal, and Google Gemini estimates
// the calories, protein, carbs and fat of every food on it.
function NutritionPage() {
  const inputRef = useRef(null);
  const [photo, setPhoto] = useState(null); // data URL of the (shrunk) photo
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose a photo (JPEG, PNG or WebP).');
      return;
    }
    setError('');
    setResult(null);
    let image;
    try {
      image = await shrinkImage(file);
    } catch {
      setError('This photo could not be opened. Please try a JPEG or PNG photo.');
      return;
    }
    setPhoto(image);
    setIsAnalyzing(true);
    try {
      setResult(await analyzeMealPhoto(image));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  function reset() {
    setPhoto(null);
    setResult(null);
    setError('');
    inputRef.current.value = '';
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files[0]);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Food scanner"
        description="Take a photo of your meal and see its calories, protein, carbs and fat."
        actions={
          photo && (
            <Button variant="secondary" icon={RotateCcw} onClick={reset} disabled={isAnalyzing}>
              New photo
            </Button>
          )
        }
      />

      {/* Hidden file input: on phones it offers the camera and the gallery */}
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" aria-label="Meal photo" onChange={(e) => handleFile(e.target.files[0])} />

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ---------- Photo ---------- */}
        <div className="lg:col-span-2">
          {!photo ? (
            <button
              type="button"
              onClick={() => inputRef.current.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex aspect-square w-full flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed p-8 text-center transition ${
                isDragging ? 'border-brand-500 bg-brand-50 dark:bg-brand-500/10' : 'border-line-strong bg-surface hover:border-brand-500 hover:bg-surface-2'
              }`}
            >
              <span className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-800 text-white shadow-lg">
                <Camera className="size-8" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-lg font-semibold text-ink">Take or choose a photo</span>
                <span className="mt-1 block text-sm text-muted">or drag a photo here</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-faint">
                <ImageUp className="size-3.5" aria-hidden="true" />
                JPEG, PNG or WebP
              </span>
            </button>
          ) : (
            <div className="relative overflow-hidden rounded-3xl border border-line bg-surface-3 shadow-sm">
              <img src={photo} alt="Your meal" className="aspect-square w-full object-cover" />
              {/* Scanning animation while Gemini looks at the photo */}
              {isAnalyzing && (
                <div className="absolute inset-0 bg-slate-950/40" aria-hidden="true">
                  <m.div
                    className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-brand-400/50 to-transparent"
                    animate={{ top: ['-20%', '100%'] }}
                    transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <span className="absolute inset-x-0 bottom-5 flex justify-center">
                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-4 py-2 text-sm font-medium text-white backdrop-blur-md">
                      <ScanSearch className="size-4 animate-pulse" aria-hidden="true" />
                      Analysing your meal…
                    </span>
                  </span>
                </div>
              )}
            </div>
          )}
          <p className="mt-3 flex items-start gap-2 text-xs text-muted">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            The photo is sent to Google Gemini for the analysis. It is not saved in GymFlow.
          </p>
        </div>

        {/* ---------- Result ---------- */}
        <div className="lg:col-span-3" aria-live="polite">
          <ErrorMessage>{error}</ErrorMessage>

          {!result && !error && (
            <Card>
              <EmptyState
                icon={isAnalyzing ? Sparkles : UtensilsCrossed}
                title={isAnalyzing ? 'Looking at your meal…' : 'Your meal’s nutrition appears here'}
                description={isAnalyzing ? 'This takes a few seconds.' : 'Works best with the whole plate in the photo, from above, in good light.'}
              />
            </Card>
          )}

          <AnimatePresence>
            {result && !result.isFood && (
              <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <EmptyState icon={UtensilsCrossed} title="No food found" description="We could not see a meal on this photo. Try again with the plate in the middle of the picture." />
                </Card>
              </m.div>
            )}

            {result?.isFood && (
              <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-900 p-6 text-white shadow-lg">
                  <Flame aria-hidden="true" strokeWidth={1.25} className="absolute -right-6 -bottom-8 -z-10 size-44 text-white/15" />
                  <p className="text-sm font-medium text-white/80">This meal has about</p>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="font-display text-7xl leading-none font-bold">
                      <AnimatedNumber value={result.totals.calories} />
                    </span>
                    <span className="text-xl text-white/80">kcal</span>
                  </p>
                  <p className="mt-3 text-sm text-white/80">
                    {result.items.length} {result.items.length === 1 ? 'food' : 'foods'} found · {result.totals.proteinG} g protein
                  </p>
                </section>

                <Card title="Where the calories come from">
                  <MacroBreakdown totals={result.totals} />
                </Card>

                <Card title="Foods on the plate" padded={false}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-line-soft text-left text-xs text-muted">
                          <th scope="col" className="px-5 py-2.5 font-medium">Food</th>
                          <th scope="col" className="px-3 py-2.5 text-right font-medium">Portion</th>
                          <th scope="col" className="px-3 py-2.5 text-right font-medium">kcal</th>
                          <th scope="col" className="px-3 py-2.5 text-right font-medium">Protein</th>
                          <th scope="col" className="px-3 py-2.5 text-right font-medium">Carbs</th>
                          <th scope="col" className="px-5 py-2.5 text-right font-medium">Fat</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line-soft">
                        {result.items.map((item) => (
                          <tr key={item.name}>
                            <th scope="row" className="px-5 py-3 text-left font-medium text-ink">{item.name}</th>
                            <td className="px-3 py-3 text-right text-ink-3">{item.portionGrams} g</td>
                            <td className="px-3 py-3 text-right font-semibold text-ink">{item.calories}</td>
                            <td className="px-3 py-3 text-right text-ink-3">{item.proteinG} g</td>
                            <td className="px-3 py-3 text-right text-ink-3">{item.carbsG} g</td>
                            <td className="px-5 py-3 text-right text-ink-3">{item.fatG} g</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>

                <p className="flex items-start gap-2 rounded-xl bg-surface-2 px-4 py-3 text-sm text-ink-3">
                  <Info className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
                  <span>
                    These are AI estimates from a photo – real values depend on the recipe and portion size.
                    {result.note && <span className="mt-1 block text-muted">{result.note}</span>}
                  </span>
                </p>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default NutritionPage;
