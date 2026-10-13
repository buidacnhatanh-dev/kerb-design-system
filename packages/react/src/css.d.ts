// CSS Modules: a map from the class names written in the file to the scoped names
declare module "*.module.css" {
  const classes: Readonly<Record<string, string>>;
  export default classes;
}

// Stylesheets imported for their side effects only
declare module "*.css" {}
