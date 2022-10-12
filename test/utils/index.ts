import { parseUnits } from "ethers/lib/utils"

export const parseTokenUnits = (amount: number) => {
  return parseUnits(String(amount))
}
