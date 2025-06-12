import {decompileCell} from "../../runtime"
import {executeInstructions} from "../../helpers"
import {collectFuncCoverage, recompileCell} from "../index"
import {generateHtml} from "../html"
import {writeFileSync} from "node:fs"
import {execSync} from "node:child_process"
import * as fs from "node:fs/promises"
import {loadFuncMapping} from "../../trace"
import {normalizeIndentation} from "../../runtime/test/utils"
import {Cell, TupleBuilder} from "@ton/core"
import path from "node:path"

const FUNC_BIN = "/Users/petrmakhnev/ton-tolk/cmake-build-debug/crypto/func"
const FIFT_BIN = "/Users/petrmakhnev/ton-tolk/cmake-build-debug/crypto/fift"

describe("asm coverage", () => {
    const test =
        (name: string, code: string, id: number = 0) =>
        async () => {
            const funcSourcesPath = `${__dirname}/in.fc`
            await fs.writeFile(funcSourcesPath, normalizeIndentation(code))
            const outBoc = `${__dirname}/out.boc`
            const funcResult = execSync(`${FUNC_BIN} -AP -d -o ${__dirname}/out.fif -W ${outBoc} ${__dirname}/in.fc`, { encoding: "utf8" })
            console.log(funcResult)

            const fiftResult = execSync(`${FIFT_BIN} -I /Users/petrmakhnev/ton-tolk/crypto/fift/lib ${__dirname}/out.fif`, { encoding: "utf8" })
            console.log(fiftResult)

            const sourceMap = loadFuncMapping(await fs.readFile(`${__dirname}/out.fif.source_map.json`, "utf8"))
            console.log(sourceMap)

            const cell = Cell.fromBoc(await fs.readFile(outBoc))[0] ?? new Cell()

            const [cleanCell] = recompileCell(cell, true)
            const instructions = decompileCell(cleanCell)

            const stack = new TupleBuilder()
            stack.writeNumber(10)
            const [,logs] = await executeInstructions(instructions, 0, stack)

            const {lines} = collectFuncCoverage(cell, logs, funcSourcesPath, sourceMap)

            const combinedReportPath = path.join(__dirname, "coverage-func.html")
            writeFileSync(combinedReportPath, generateHtml(lines, {
                gasBackground: false,
                gasDetails: false,
            }))
            console.log(`\n✅ Report generated: ${combinedReportPath}`)
        }

    it(
        "simple if",
        test(
            "simple if",
            `
                #include "stdlib.fc";

                global int foo;

                int test(int x, int y) {
                    (builder build, cell cel) = (begin_cell(), begin_cell().end_cell());
                    if (
                        x > 10 
                            ? -1 
                            : 0
                    ) {
                        throw(20);
                    } else {
                        dump_stack();
                    }
                    int three = 3;
                    int res = x
                                * three
                                * y;
                    return res + 
                        build.builder_bits() 
                        + 
                        10
                        + 
                        cel.begin_parse().string_hash();
                }
                
                () recv_internal(int val) {
                    foo = 100;
                    if (val != 0) {
                        throw(
                            foo - 100
                        );
                    }
                    if (test(val, val)) {
                        throw(0);
                    }
                    return ();
                }

                () recv_external() {
                    foo = 100;
                    throw(foo);
                }
            `,
        ),
    )
})
