// @ts-check
import esbuild from 'rollup-plugin-esbuild'
export default {
  input: 'src/index.ts',
  external: ['fabric'],
  plugins: [
    esbuild({
      tsconfig: './tsconfig.json',
      sourceMap: false,
      minify: false,
      target: 'es2015'
    })
  ],
  output: {
    name: 'LineDrawer',
    dir: 'dist',
    format: 'umd'
  }
}
