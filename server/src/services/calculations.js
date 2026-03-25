/**
 * All agricultural calculations for the ANC Grazing app.
 * Pure functions — take numbers in, return numbers out.
 * These are the single source of truth; never recalculate on the frontend.
 */

const VALID_STAC_RATINGS = [3, 6, 9, 12]

// LSU = (numberOfAnimals × averageWeightKg) / 450
function calcLsu(numberOfAnimals, averageWeightKg) {
  return (numberOfAnimals * averageWeightKg) / 450
}

// KgDMU = LSU × 8.5  (daily feed demand per LSU)
function calcKgdmu(lsu) {
  return lsu * 8.5
}

// KgDM Total = KgDMU × numberOfAnimals  (total daily demand for the mob)
function calcKgdmTotal(kgdmu, numberOfAnimals) {
  return kgdmu * numberOfAnimals
}

// KgDM per ha = STAC rating × 11.25
function calcKgdmPerHa(stacRating) {
  if (!VALID_STAC_RATINGS.includes(stacRating)) {
    throw Object.assign(new Error('STAC rating must be 3, 6, 9, or 12.'), { status: 400 })
  }
  return stacRating * 11.25
}

// Total paddock KgDM = paddock size (ha) × KgDM per ha
function calcTotalKgdm(sizeHa, kgdmPerHa) {
  return sizeHa * kgdmPerHa
}

// Graze period (days) = total paddock KgDM / mob daily KgDM demand
function calcGrazePeriod(totalPaddockKgdm, mobDailyKgdmDemand) {
  if (mobDailyKgdmDemand <= 0) return 0
  return totalPaddockKgdm / mobDailyKgdmDemand
}

// SR:CC = total farm LSU / total carrying capacity LSU
// srccStatus: overstocked if ratio > 1.0
function calcSrcc(totalFarmLsu, totalCarryingCapacityLsu) {
  if (totalCarryingCapacityLsu <= 0) return { srccRatio: 0, srccStatus: 'balanced' }
  const srccRatio = totalFarmLsu / totalCarryingCapacityLsu
  return {
    srccRatio: Math.round(srccRatio * 100) / 100,
    srccStatus: srccRatio > 1.0 ? 'overstocked' : 'balanced',
  }
}

// Convenience: calculate all stock flow derived fields at once
function calcStockFlowFields(numberOfAnimals, averageWeightKg) {
  const lsu = calcLsu(numberOfAnimals, averageWeightKg)
  const kgdmu = calcKgdmu(lsu)
  const kgdmTotal = calcKgdmTotal(kgdmu, numberOfAnimals)
  return {
    lsu: Math.round(lsu * 100) / 100,
    kgdmu: Math.round(kgdmu * 100) / 100,
    kgdmTotal: Math.round(kgdmTotal * 100) / 100,
  }
}

// Convenience: calculate all paddock derived fields at once
function calcPaddockFields(sizeHa, stacRating) {
  const kgdmPerHa = calcKgdmPerHa(stacRating)
  const totalKgdm = calcTotalKgdm(sizeHa, kgdmPerHa)
  return {
    kgdmPerHa: Math.round(kgdmPerHa * 100) / 100,
    totalKgdm: Math.round(totalKgdm * 100) / 100,
  }
}

module.exports = {
  VALID_STAC_RATINGS,
  calcLsu,
  calcKgdmu,
  calcKgdmTotal,
  calcKgdmPerHa,
  calcTotalKgdm,
  calcGrazePeriod,
  calcSrcc,
  calcStockFlowFields,
  calcPaddockFields,
}
