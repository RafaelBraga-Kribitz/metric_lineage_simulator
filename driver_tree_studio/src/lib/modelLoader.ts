/**
 * Loads the default DTC e-commerce seed model for the UI.
 */
import seed from "../content/dtc_ecommerce.json";
import type { BusinessModel } from "../schema/types";

export function loadDefaultModel(): BusinessModel {
  return seed as BusinessModel;
}
