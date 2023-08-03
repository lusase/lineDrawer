
import fs from 'node:fs/promises'
import {existsSync} from 'node:fs'
import {execa} from 'execa'
async function build() {
  if (existsSync('../dist')) {
    await fs.rm('../dist', {recursive: true})
  }
  await execa('rollup', ['-c'])
}

build()
