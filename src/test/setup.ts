import "@testing-library/jest-dom";
import { expect } from "vitest";
import * as matchers from "@testing-library/jest-dom/matchers";

console.log("Setup file loaded");
expect.extend(matchers);
console.log("Matchers extended");
