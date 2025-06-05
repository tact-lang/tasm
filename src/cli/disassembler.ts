#!/usr/bin/env node

import {cac} from "cac"
import * as fs from "node:fs/promises"
import {Cell} from "@ton/core"
import {decompileCell} from "../runtime"
import {print} from "../text"

interface Options {
    output: string
    format: string
    verbose: boolean
}

async function getBocBuffer(options: Options, file: string) {
    if (options.format === "binary") {
        return fs.readFile(file)
    }

    const content = await fs.readFile(file, "utf8")
    const trimmedContent = content.trim()

    if (!trimmedContent) {
        throw new Error("File is empty")
    }

    if (options.format === "hex") {
        return Buffer.from(trimmedContent, "hex")
    }

    if (options.format === "base64") {
        return Buffer.from(trimmedContent, "base64")
    }

    throw new Error(`Unsupported format: ${options.format}`)
}

const cli = cac("disasm")

cli.command("[file]", "Disassemble a BOC file to TASM")
    .option("-o, --output <file>", "Output file path")
    .option("-f, --format <format>", "Input format (binary|hex|base64)", {default: "binary"})
    .option("--verbose", "Verbose output")
    .action(async (file: string, options: Options) => {
        if (!file) {
            console.error("Error: Input file is required")
            process.exit(1)
        }

        try {
            if (options.verbose) {
                console.log(`Reading file: ${file}`)
            }

            const bocBuffer = await getBocBuffer(options, file)

            if (options.verbose) {
                console.log(`Parsed BOC buffer of ${bocBuffer.length} bytes`)
            }

            const [rootCell] = Cell.fromBoc(bocBuffer)
            if (!rootCell) {
                throw new Error("No cells found in BOC")
            }

            const instructions = decompileCell(rootCell)

            if (options.verbose) {
                console.log(`Decompiled ${instructions.length} instructions`)
            }

            const assemblyText = print(instructions)

            if (options.output) {
                await fs.writeFile(options.output, assemblyText)
                if (options.verbose) {
                    console.log(`Written to: ${options.output}`)
                }
            } else {
                console.log(assemblyText)
            }
        } catch (error: unknown) {
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            console.error(`Error: ${error instanceof Error ? error.message : error}`)
            process.exit(1)
        }
    })

cli.help()
cli.version("0.0.1")

cli.parse()
