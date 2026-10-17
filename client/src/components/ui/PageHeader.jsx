import PageTitle from './PageTitle.jsx';

// Title at the top of every page, with an optional description and action buttons.
// It also sets the browser tab title; `tabTitle` replaces it when the heading is too personal or long
// (e.g. "Welcome back, Ali" → "Home").
function PageHeader({ title, tabTitle = title, description, actions }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <PageTitle>{tabTitle}</PageTitle>
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
        {description && <p className="mt-1 text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export default PageHeader;
