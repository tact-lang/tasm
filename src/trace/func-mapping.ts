export enum FuncType {
    INT = 172,
    CELL = 173,
    SLICE = 174,
    BUILDER = 175,
    CONT = 176,
    TUPLE = 177,
    TYPE = 178,
}

export enum FuncVarFlag {
    IN = 1,
    NAMED = 2,
    TMP = 4,
}

/**
 * Represents a FunC source location.
 */
export type FuncSourceLoc = {
    readonly file: string
    readonly line: number
    readonly pos: number
    readonly length: number
    readonly vars: undefined | FuncVar[]
    readonly func: string
    readonly first_stmt: undefined | boolean
    readonly ret: undefined | boolean
}

/**
 * Represents a FunC local variable descriptor.
 */
export type FuncVar = {
    readonly name: string
    readonly type: FuncType
    readonly flags: number // FuncVarFlag
    readonly value?: string
}

/**
 * Represents a FunC global variable descriptor.
 */
export type FuncGlobalVar = {
    readonly name: string
}

/**
 * Represents a FunC mapping.
 */
export type FuncMapping = {
    readonly globals: readonly FuncGlobalVar[]
    readonly locations: readonly FuncSourceLoc[]
}

/**
 * Loads a FunC mapping from a string.
 */
export const loadFuncMapping = (content: string): FuncMapping => {
    return JSON.parse(content) as FuncMapping
}
