import { join } from 'path'

const projectRoot = process.cwd()
export const dataDir = join(projectRoot, 'data')
export const credentialsPath = join(dataDir, 'zalo-bot-credentials.json')
export const errorLogPath = join(dataDir, 'zalo-bot-errors.log')
