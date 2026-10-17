// Sets the browser tab title, e.g. "People · GymFlow".
// React 19 moves a <title> rendered anywhere into the page <head> automatically.
function PageTitle({ children }) {
  return <title>{`${children} · GymFlow`}</title>;
}

export default PageTitle;
