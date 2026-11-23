// Sets light/dark mode before the page is drawn, so dark-mode users never see a white flash.
// Same rule as src/theme/ThemeProvider.jsx: the saved choice, otherwise the system setting.
// A separate file (not inline in index.html) so the Content Security Policy can forbid inline scripts.
try {
  var saved = localStorage.getItem('gymflow_theme');
  var dark = saved ? saved === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
} catch {
  // Storage blocked (e.g. private mode): keep the default light theme.
}
