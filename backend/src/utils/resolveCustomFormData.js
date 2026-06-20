import { CreateDetails, Country, State, District } from '../models/index.js';

const parseCustomFormData = (raw) => {
  if (!raw) return {};
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return raw;
};

const parseFormDefinition = (raw) => {
  if (!raw) return null;
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
};

const formatFieldValue = (rawValue, fieldType) => {
  if (rawValue === null || rawValue === undefined || rawValue === '') return null;

  if (Array.isArray(rawValue)) {
    return rawValue.map(v => String(v)).join(', ');
  }

  if (typeof rawValue === 'object') {
    if (rawValue.name) return String(rawValue.name);
    return JSON.stringify(rawValue);
  }

  if (fieldType === 'date') {
    const date = new Date(rawValue);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  return String(rawValue);
};

/**
 * Resolve custom_form_data field IDs to human-readable labels and values.
 * Maps country/state/district IDs to names using the app's custom form definition.
 */
export async function buildRegistrationFormSummary(groupId, customFormDataRaw) {
  const customFormData = parseCustomFormData(customFormDataRaw);

  const appDetails = await CreateDetails.findOne({ where: { create_id: groupId } });
  const formDefinition = parseFormDefinition(appDetails?.custom_form);
  const fields = Array.isArray(formDefinition?.fields) ? formDefinition.fields : [];

  const countryIds = new Set();
  const stateIds = new Set();
  const districtIds = new Set();

  fields.forEach((field) => {
    const value = customFormData[field.id];
    if (value && field.mapping) {
      const numericValue = parseInt(value, 10);
      if (!Number.isNaN(numericValue)) {
        if (field.mapping === 'country') countryIds.add(numericValue);
        if (field.mapping === 'state') stateIds.add(numericValue);
        if (field.mapping === 'district') districtIds.add(numericValue);
      }
    }
  });

  const [countries, states, districts] = await Promise.all([
    countryIds.size > 0 ? Country.findAll({ where: { id: Array.from(countryIds) } }) : [],
    stateIds.size > 0 ? State.findAll({ where: { id: Array.from(stateIds) } }) : [],
    districtIds.size > 0 ? District.findAll({ where: { id: Array.from(districtIds) } }) : []
  ]);

  const countryMap = new Map(countries.map(c => [c.id, c.country]));
  const stateMap = new Map(states.map(s => [s.id, s.state]));
  const districtMap = new Map(districts.map(d => [d.id, d.district]));

  const resolvedFormData = {};
  const registrationFields = [];

  if (fields.length > 0) {
    fields
      .filter(field => field.enabled !== false)
      .forEach((field) => {
        const rawValue = customFormData[field.id];
        let resolvedValue = rawValue;

        if (rawValue !== null && rawValue !== undefined && rawValue !== '' && field.mapping) {
          const numericValue = parseInt(rawValue, 10);
          if (!Number.isNaN(numericValue)) {
            if (field.mapping === 'country') resolvedValue = countryMap.get(numericValue) || rawValue;
            if (field.mapping === 'state') resolvedValue = stateMap.get(numericValue) || rawValue;
            if (field.mapping === 'district') resolvedValue = districtMap.get(numericValue) || rawValue;
          }
        }

        const displayValue = formatFieldValue(resolvedValue, field.field_type);
        if (displayValue === null) return;

        resolvedFormData[field.id] = {
          raw: rawValue,
          resolved: displayValue,
          label: field.label || field.placeholder || field.id,
          fieldType: field.field_type,
          mapping: field.mapping || null,
          options: field.options || null,
          order: field.order ?? 0
        };

        registrationFields.push({
          id: field.id,
          label: field.label || field.placeholder || field.id,
          value: displayValue,
          order: field.order ?? 0
        });
      });
  } else {
    Object.entries(customFormData).forEach(([key, value]) => {
      const displayValue = formatFieldValue(value, 'text');
      if (displayValue === null) return;

      resolvedFormData[key] = {
        raw: value,
        resolved: displayValue,
        label: key,
        fieldType: 'text',
        mapping: null,
        options: null,
        order: 0
      };

      registrationFields.push({
        id: key,
        label: key.replace(/^field_/, 'Field '),
        value: displayValue,
        order: 0
      });
    });
  }

  registrationFields.sort((a, b) => a.order - b.order);

  return { resolved_form_data: resolvedFormData, registration_fields: registrationFields };
}
