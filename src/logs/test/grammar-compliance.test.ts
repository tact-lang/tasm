import {parse} from "../parse"
import * as $ from "../grammar.gen.pegjs"
import type * as G from "../grammar"

describe("Grammar Rules Compliance", () => {
    describe("vmLine rules", () => {
        test("VmLoc", () => {
            const input =
                "code cell hash: 6DB0B8EFEF2B59D53B896E2A6EBCBBEF72BE9A1F8CD2DA1D0E8EA8F57C4F8AE0 offset:2608"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmLoc")
            if (result.$ === "VmLoc") {
                expect(typeof result.hash).toBe("string")
                expect(result.hash).toBe(
                    "6DB0B8EFEF2B59D53B896E2A6EBCBBEF72BE9A1F8CD2DA1D0E8EA8F57C4F8AE0",
                )
                expect(result.offset).toEqual({op: undefined, value: "2608"})
            }
        })

        test("VmStack", () => {
            const input = "stack: [98 100 0 101]"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmStack")
            if (result.$ === "VmStack") {
                expect(typeof result.stack).toBe("string")
                expect(result.stack).toBe("[98 100 0 101]")
            }
        })

        test("VmExecute", () => {
            const input = "execute PUSHINT 0"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmExecute")
            if (result.$ === "VmExecute") {
                expect(typeof result.instr).toBe("string")
                expect(result.instr).toBe("PUSHINT 0")
            }
        })

        test("VmLimitChanged", () => {
            const input = "changing gas limit to 100"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmLimitChanged")
            if (result.$ === "VmLimitChanged") {
                expect(result.limit).toEqual({op: undefined, value: "100"})
            }
        })

        test("VmGasRemaining", () => {
            const input = "gas remaining: 999999998"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmGasRemaining")
            if (result.$ === "VmGasRemaining") {
                expect(result.gas).toEqual({op: undefined, value: "999999998"})
            }
        })

        test("VmException", () => {
            const input = "handling exception code 2: stack underflow"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmException")
            if (result.$ === "VmException") {
                expect(result.errno).toEqual({op: undefined, value: "2"})
                expect(typeof result.message).toBe("string")
                expect(result.message).toBe("stack underflow")
            }
        })

        test("VmExceptionHandler", () => {
            const input = "default exception handler, terminating vm with exit code 2"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmExceptionHandler")
            if (result.$ === "VmExceptionHandler") {
                expect(result.errno).toEqual({op: undefined, value: "2"})
            }
        })

        test("VmFinalC5", () => {
            const input = "final c5:C{00000000}"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmFinalC5")
            if (result.$ === "VmFinalC5") {
                expect(result.value).toEqual({$: "Cell", value: "00000000"})
            }
        })

        test("VmUnknown", () => {
            const input = "VM Log Message Here"
            const result = $.parse(input, {startRule: "vmLine"}) as G.$ast.vmLine

            expect(result.$).toBe("VmUnknown")
            if (result.$ === "VmUnknown") {
                expect(typeof result.text).toBe("string")
                expect(result.text).toBe("VM Log Message Here")
            }
        })
    })

    describe("Stack parsing rules", () => {
        test("VmParsedStack with simple integers", () => {
            const input = "[98 100 0]"
            const result = $.parse(input, {startRule: "VmParsedStack"}) as G.$ast.VmParsedStack

            expect(result.$).toBe("VmParsedStack")
            expect(Array.isArray(result.values)).toBe(true)
            expect(result.values).toHaveLength(3)

            // Check first value structure
            const firstValue = result.values[0]
            expect(firstValue?.$).toBe("VmStackValue")
            expect(firstValue?.value.$).toBe("Integer")
            if (firstValue?.value.$ === "Integer") {
                expect(firstValue.value.value).toEqual({op: undefined, value: "98"})
            }
        })

        test("VmParsedStack with complex types", () => {
            const input = "[98 () NaN C{DEAD} [1 2]]"
            const result = $.parse(input, {startRule: "VmParsedStack"}) as G.$ast.VmParsedStack

            expect(result.$).toBe("VmParsedStack")
            expect(Array.isArray(result.values)).toBe(true)
            expect(result.values).toHaveLength(5)

            // Check types
            const values = result.values
            expect(values[0]?.value.$).toBe("Integer")
            expect(values[1]?.value.$).toBe("Null")
            expect(values[2]?.value.$).toBe("NaN")
            expect(values[3]?.value.$).toBe("Cell")
            expect(values[4]?.value.$).toBe("Tuple")
        })
    })

    describe("Integration with parse.ts", () => {
        test("parse function handles all vm line types", () => {
            const testLog = `code cell hash:6DB0B8EFEF2B59D53B896E2A6EBCBBEF72BE9A1F8CD2DA1D0E8EA8F57C4F8AE0 offset:2608
stack: [98 100 0 101]
execute PUSHINT 0
gas remaining: 999999998
changing gas limit to 100
handling exception code 2: stack underflow
default exception handler, terminating vm with exit code 2
final c5:C{00000000}
VM Log Message Here`

            const result = parse(testLog)

            expect(result).toHaveLength(9)
            expect(result[0]?.$).toBe("VmLoc")
            expect(result[1]?.$).toBe("VmStack")
            expect(result[2]?.$).toBe("VmExecute")
            expect(result[3]?.$).toBe("VmGasRemaining")
            expect(result[4]?.$).toBe("VmLimitChanged")
            expect(result[5]?.$).toBe("VmException")
            expect(result[6]?.$).toBe("VmExceptionHandler")
            expect(result[7]?.$).toBe("VmFinalC5")
            expect(result[8]?.$).toBe("VmUnknown")
        })

        test("detailed type checking for parsed results", () => {
            const result = parse("final c5:C{00000000}")
            expect(result).toHaveLength(1)
            const finalC5 = result[0]

            expect(finalC5?.$).toBe("VmFinalC5")
            if (finalC5?.$ === "VmFinalC5") {
                expect(typeof finalC5.hex).toBe("string")
                expect(finalC5.hex).toBe("00000000")
            }
        })

        test("stack parsing validates structure", () => {
            const result = parse("stack: [98 () NaN C{DEAD}]")
            expect(result).toHaveLength(1)
            const stackLine = result[0]

            expect(stackLine?.$).toBe("VmStack")
            if (stackLine?.$ === "VmStack") {
                expect(Array.isArray(stackLine.stack)).toBe(true)
                expect(stackLine.stack).toHaveLength(4)

                expect(stackLine.stack[0]?.$).toBe("Integer")
                expect(stackLine.stack[1]?.$).toBe("Null")
                expect(stackLine.stack[2]?.$).toBe("NaN")
                expect(stackLine.stack[3]?.$).toBe("Cell")
            }
        })
    })
})
