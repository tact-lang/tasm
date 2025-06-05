{{}}

vmLine
  = VmLoc
  / VmStack
  / VmExecute
  / VmLimitChanged
  / VmGasRemaining
  / VmException
  / VmExceptionHandler
  / VmFinalC5
  / VmUnknown

VmStack
  = "stack: " stack:$[^\r\n]* {
    return { $: 'VmRawStack', stack };
  }

VmLoc
  = "code cell hash:" hash:hex " offset:" offset:number {
    return { $: 'VmLoc', hash: hash.trim(), offset };
  }

VmExecute
  = "execute " instr:$[^\r\n]* {
    return { $: 'VmExecute', instr: instr.trim() };
  }

VmLimitChanged
  = "changing gas limit to " limit:number {
    return { $: 'VmLimitChanged', limit };
  }

VmGasRemaining
  = "gas remaining: " gas:number {
    return { $: 'VmGasRemaining', gas };
  }

VmException
  = "handling exception code " errno:number ": " message:$[^\r\n]* {
    return { $: 'VmException', errno, message: message.trim() };
  }

VmExceptionHandler
  = "default exception handler, terminating vm with exit code " errno:number {
    return { $: 'VmExceptionHandler', errno };
  }

VmFinalC5
  = "final c5:" value:Cell {
    return { $: 'VmFinalC5', value: { value: value.boc }};
  }

VmUnknown
  = !("stack" / "code cell hash:" / "execute " / "changing gas limit to " / "gas remaining: " / "handling exception code " / "default exception handler, terminating vm with exit code " / "final c5:") text:$[^\r\n]* {
    return { $: 'VmUnknown', text: text.trim() };
  }

VmParsedStack
  = "[" space* values:VmStackValue* "]" {
    return { $: 'VmParsedStack', values };
  }

VmStackValue
  = space* value:(
      Null
    / NaN
    / Integer
    / Tuple
    / TupleParen
    / Cell
    / Continuation
    / Builder
    / CellSlice
    / Unknown
  ) space* {
    return value;
  }

Null
  = ("()" / "(null)") { return { $: "Null" }; }

NaN
  = "NaN" { return { $: "NaN" }; }

Integer
  = value:number { return { $: "Integer", value: value }; }

Tuple
  = "[" space* elements:VmStackValue* "]" {
    return { $: "Tuple", elements };
  }

TupleParen
  = "(" space* elements:VmStackValue* ")" {
    return { $: "Tuple", elements };
  }

Cell
  = "C{" value:hex "}" {
    return { $: "Cell", boc: value };
  }

Continuation
  = "Cont{" value:$[A-Za-z_0-9]* "}" {
    return { $: "Continuation", name: value };
  }

Builder
  = "BC{" value:hex "}" {
    return { $: "Builder", hex: value };
  }

Unknown
  = "???" { return { $: "Unknown", value: "" }; }

CellSlice
  = "CS{" body:(CellSliceBody / CellSliceShortBody) "}" {
    if (body.bits && body.refs) {
      return { 
        $: "Slice", 
        hex: body.value,
        startBit: body.bits.start,
        endBit: body.bits.end,
        startRef: body.refs.start,
        endRef: body.refs.end
      };
    }
    return { 
      $: "Slice", 
      hex: body.value,
      startBit: 0,
      endBit: 0,
      startRef: 0,
      endRef: 0
    };
  }

CellSliceBody
  = "Cell{" value:hex "}" bits:CellSliceBits ";" refs:CellSliceRefs {
    return { value, bits, refs };
  }

CellSliceBits
  = "bits:" start:number ".." end:number {
    return { start, end };
  }

CellSliceRefs
  = "refs:" start:number ".." end:number {
    return { start, end };
  }

CellSliceShortBody
  = value:hex {
    return { value };
  }

number
  = "-"? digits:$[0-9]+ {
    return { op: "", value: digits };
  }

hex
  = $[0-9a-fA-F]*

space
  = [ \t\r\n] 
