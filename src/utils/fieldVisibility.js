const normalizeFieldName = (field) => String(field ?? "").toLowerCase()

export const isIdField = (field) => normalizeFieldName(field).includes("id")

export const isNumberField = (field) => String(field ?? "").includes("编号")

export const shouldHideField = (field, settings) => {
  if (!settings) return false
  if (settings.hideId && isIdField(field)) return true
  if (settings.hideNumber && isNumberField(field)) return true
  return false
}

export const visibleEntries = (item, settings) => {
  return Object.entries(item || {}).filter(([key]) => !shouldHideField(key, settings))
}
