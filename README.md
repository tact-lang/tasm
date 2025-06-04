# TON Assembly

This repository contains an assembler and disassembler implementation for TVM bitcode.

This implementation provides a complete cycle
`Text -> Internal representation -> Cells -> BoC -> Cells -> Internal representation -> Text`, this means that the same
text assembly can be obtained from a text assembly, going through all the compilation and decompilation steps.

During compilation, the assembler collects additional mappings that can be used to convert the TVM log into a full trace
that will refer to specific instructions in the decompiled version of the contract.

This mapping looks like this:

```
cell-hash + offset -> instruction
```

This implementation is able to generate a coverage report for the contract by BoC and logs
from [Sandbox](https://github.com/ton-org/sandbox).
The proof of concept can be found in the [`./src/coverage`](./src/coverage) folder.

`instructionNameForOpcode()` function can be used to get the name of the instruction for a given opcode, which is useful
for runtime debugging with TVM since TVM itself provides only integer opcodes.

## Validity

The assembler was tested on 106k contracts from the blockchain
where it successfully decompiled and compiled all contracts into equivalent **Cells**.

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

MIT © [TON Studio](https://tonstudio.io).
