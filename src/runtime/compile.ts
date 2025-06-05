import * as c from "./constructors"
import * as $ from "./util"
import type {Instr} from "./instr-gen"
import {CodeBuilder} from "./builder"
import {instr} from "./instr"
import {matchingRule} from "./layout"

export const compileInstructions: $.Store<Instr[]> = (b: CodeBuilder, instructions: Instr[]) => {
    for (let index = 0; index < instructions.length; index++) {
        const instruction = instructions[index]
        if (!instruction) break
        const builderBefore = new CodeBuilder().storeBuilder(b)

        const overflow = safeStore(b, instruction)
        if (!overflow) {
            // fast path
            continue
        }

        // Handle case where instructions don't fit to the current cell.
        // In many cases, this happens at the if-else boundary, when the body
        // specified via PUSHCONT takes up a large number of bits. In this case, we
        // need to create a new ref and continue compiling the remaining instructions
        // into this ref
        const remainingInstructions = instructions.slice(index)

        // But we can try to optimize code like this:
        // ref {
        //   PUSHCONT { ... }
        //   IF
        //   ...
        // }
        // ->
        // IFREF { ... }
        // ...
        const match = matchingRule(remainingInstructions)
        if (match) {
            const instr = match.rule.ctor(match.body)
            match.rule.type.store(builderBefore, instr)
            b.reinitFrom(builderBefore)
            index++ // advance to not store instruction once again

            // All instructions after PUSHCONT + IF will be compiled in the current cell and
            // placed in a new cell if necessary.
            continue
        }

        // Create a new ref and compile the remaining instruction to it
        $.PSEUDO_PUSHREF.store(builderBefore, c.PSEUDO_PUSHREF($.code(remainingInstructions)))
        b.reinitFrom(builderBefore)
        // All remaining instructions already processed in PSEUDO_PUSHREF,
        // so we need to return here
        return
    }
}

const safeStore = (b: CodeBuilder, t: Instr): boolean => {
    try {
        instr.store(b, t)
        if (b.bits >= 1023) {
            return true
        }
    } catch (error: unknown) {
        if (error instanceof Error && error.message === "BitBuilder overflow") {
            return true
        }

        throw error
    }

    return false
}
