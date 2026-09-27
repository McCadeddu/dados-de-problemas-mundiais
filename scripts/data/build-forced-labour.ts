import { writeFile } from 'node:fs/promises'
import { forcedLabourEstimate, validateForcedLabour, forcedLabourCsv } from '../../src/lib/forcedLabour.js'

validateForcedLabour(forcedLabourEstimate)
await writeFile('public/data/forced-labour-2021.json', JSON.stringify(forcedLabourEstimate))
await writeFile('public/data/forced-labour-2021.csv', forcedLabourCsv())
console.log('OIT: edição 2022 revisada, referência 2021; três modalidades e cinco regiões reconciliadas com o total mundial.')
