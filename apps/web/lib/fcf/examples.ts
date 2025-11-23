import { FcfJson } from "./schema";

export const exampleFcf: FcfJson = {
  source: { inputType: "builder" },
  characteristic: "position",
  tolerance: { value: 0.7, diameter: true },
  modifiers: ["MMC"],
  datums: [
    { id: "A", materialCondition: "RFS" },
    { id: "B", materialCondition: "RFS" },
    { id: "C", materialCondition: "RFS" }
  ],
  pattern: { count: 2, note: "2X" }
};
