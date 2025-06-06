#!/usr/bin/env node

import {cac} from "cac"
import * as fs from "node:fs/promises"
import {parse} from "../text"
import {compileCell} from "../runtime"

interface Options {
    output: string
    format: string
    verbose: boolean
}

const cli = cac("tasm")

cli.command("[file]", "Assemble a TASM file to BOC")
    .option("-o, --output <file>", "Output file path")
    .option("-f, --format <format>", "Output format (binary|hex|base64)", {default: "binary"})
    .option("--verbose", "Verbose output")
    .action(async (file: string, options: Options) => {
        if (!file) {
            console.error("Error: Input file is required")
            process.exit(1)
        }

        try {
            const content = await fs.readFile(file, "utf8")

            if (options.verbose) {
                console.log(`Reading file: ${file}`)
            }

            const parseResult = parse(file, content)
            if (parseResult.$ === "ParseFailure") {
                console.error(
                    `Parse error: ${parseResult.error.message} at ${parseResult.error.loc.file}:${parseResult.error.loc.line}`,
                )
                process.exit(1)
            }

            if (options.verbose) {
                console.log(`Parsed ${parseResult.instructions.length} instructions`)
            }

            const cell = compileCell(parseResult.instructions)
            const boc = cell.toBoc()

            if (options.output) {
                switch (options.format) {
                    case "binary":
                        await fs.writeFile(options.output, boc)
                        break
                    case "base64":
                        await fs.writeFile(options.output, boc.toString("base64"))
                        break
                    default:
                        await fs.writeFile(options.output, boc.toString("hex"))
                        break
                }
                if (options.verbose) {
                    console.log(`Written to: ${options.output}`)
                }
            } else {
                switch (options.format) {
                    case "binary":
                        process.stdout.write(boc)
                        break
                    case "base64":
                        console.log(boc.toString("base64"))
                        break
                    default:
                        console.log(boc.toString("hex"))
                        break
                }
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
