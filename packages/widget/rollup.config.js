import typescript from "@rollup/plugin-typescript";
import terser from "@rollup/plugin-terser";

export default {
  input: "src/index.ts",
  output: {
    file: "dist/widget.js",
    format: "iife",
    name: "BookingKit",
  },
  plugins: [
    typescript({ tsconfig: "./tsconfig.json" }),
    terser(),
  ],
};
