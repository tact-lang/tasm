# TON Assembly CLI Tools

This package contains two CLI utilities for working with TON Assembly:

## 📦 Assembler (tasm)

Compiles TVM Assembly text files into binary BOC format.

### Usage

```bash
# Via yarn
yarn assembler input.tasm

# Via ts-node directly
ts-node src/cli/assembler.ts input.tasm

# Via npm binary (when installed globally)
tasm input.tasm
```

### Options

- `-o, --output <file>` - Output file path
- `-f, --format <format>` - Output format: `binary` (default), `hex`, `base64`
- `--verbose` - Verbose output
- `-h, --help` - Show help
- `-v, --version` - Show version

### Examples

```bash
# Compile to binary BOC file
tasm contract.tasm -o contract.boc

# Compile with hex output format
tasm contract.tasm -f hex -o contract.hex

# Compile with verbose output
tasm contract.tasm --verbose

# Output to stdout (hex)
tasm contract.tasm -f hex
```

## 🔍 Disassembler (disasm)

Disassembles binary BOC files back to TVM Assembly text format.

### Usage

```bash
# Via yarn
yarn disassembler contract.boc

# Via ts-node directly
ts-node src/cli/disassembler.ts contract.boc

# Via npm binary (when installed globally)
disasm contract.boc
```

### Options

- `-o, --output <file>` - Output file path
- `-f, --format <format>` - Input format: `binary` (default), `hex`, `base64`
- `--verbose` - Verbose output
- `-h, --help` - Show help
- `-v, --version` - Show version

### Examples

```bash
# Disassemble binary BOC file
disasm contract.boc -o contract.tasm

# Disassemble hex file
disasm contract.hex -f hex -o contract.tasm

# Disassemble with verbose output
disasm contract.boc --verbose

# Output to stdout
disasm contract.boc
```

## 🔄 Full Conversion Cycle

The library supports complete conversion cycle:
`Text -> Internal representation -> Cells -> BoC -> Cells -> Internal representation -> Text`

```bash
# Assemble
tasm source.tasm -o compiled.boc

# Disassemble
disasm compiled.boc -o decompiled.tasm

# Re-assemble
tasm decompiled.tasm -o recompiled.boc

# Files compiled.boc and recompiled.boc should be identical!
```

## 📝 File Formats

### Input Formats

**Assembler:**

- `.tasm` - TVM Assembly text files

**Disassembler:**

- `binary` - Binary BOC files (default)
- `hex` - BOC in hex encoding (text file)
- `base64` - BOC in base64 encoding (text file)

### Output Formats

**Assembler:**

- `binary` - Binary BOC file (default)
- `hex` - BOC in hex encoding
- `base64` - BOC in base64 encoding

**Disassembler:**

- `.tasm` - TVM Assembly text file
