TT Norms Pro setup

The UI CSS already requests the family name "TT Norms Pro" first.
For deployed iPhone/Safari testing, add your own licensed TT Norms Pro webfont files here, then add @font-face declarations at the top of src/styles.css.

Example only (filenames depend on your licensed font package):

@font-face {
  font-family: "TT Norms Pro";
  src: url("/fonts/TTNormsPro-Regular.woff2") format("woff2");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "TT Norms Pro";
  src: url("/fonts/TTNormsPro-Medium.woff2") format("woff2");
  font-weight: 500 600;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "TT Norms Pro";
  src: url("/fonts/TTNormsPro-Bold.woff2") format("woff2");
  font-weight: 700 900;
  font-style: normal;
  font-display: swap;
}

Do not redistribute font files unless your license allows it.
