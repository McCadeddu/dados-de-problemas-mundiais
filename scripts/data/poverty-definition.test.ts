import { expect, it } from 'vitest'
import { validatePovertyDefinition } from './poverty-definition.js'
const meta = { id: 'SI.POV.UMIC', source: { id: '2' }, name: 'Poverty at $8.30 (2021 PPP)', sourceNote: '2021 international prices' }
it('accepts the verified poverty definition and blocks a future or legacy PPP change', () => {
  expect(validatePovertyDefinition([{ total: 1 }, [meta]]).id).toBe('SI.POV.UMIC')
  expect(() => validatePovertyDefinition([{ total: 1 }, [{ ...meta, name: '$6.85 (2017 PPP)' }]])).toThrow(/Definição/)
  expect(() => validatePovertyDefinition([{ total: 2 }, [meta]])).toThrow(/incompletos/)
})
