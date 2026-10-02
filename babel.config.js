module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        // zustand 4 usa `import.meta.env` en su build ESM y Metro publica el bundle web como script
        // común, donde `import.meta` es un error de sintaxis (la web arrancaba en blanco).
        { unstable_transformImportMeta: true },
      ],
    ],
  };
};
