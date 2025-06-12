import type {CoverageSummary, Line} from "./data"
import {generateCoverageSummary} from "./data"
import {MAIN_TEMPLATE, SUMMARY_TEMPLATE} from "./templates/templates"

export type HtmlOptions = {
    readonly gasBackground?: boolean
    readonly gasDetails?: boolean
}

const templates = {
    main: MAIN_TEMPLATE,
    summary: SUMMARY_TEMPLATE,
}

const renderTemplate = (template: string, data: Record<string, unknown>): string => {
    return template.replaceAll(/{{(\w+)}}/g, (_, key) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        return data[key]?.toString() ?? ""
    })
}

const formatGasCosts = (gasCosts: readonly number[]): string => {
    if (gasCosts.length === 0) return ""
    if (gasCosts.length === 1) return gasCosts[0]?.toString() ?? "0"

    const gasCount: Map<number, number> = new Map()
    for (const gas of gasCosts) {
        gasCount.set(gas, (gasCount.get(gas) ?? 0) + 1)
    }

    if (gasCount.size === 1) {
        const firstEntry = [...gasCount.entries()][0]
        return firstEntry?.[0]?.toString() ?? ""
    }

    return [...gasCount.entries()]
        .sort(([gas1], [gas2]) => gas1 - gas2)
        .map(([gas, count]) => `${gas} x${count}`)
        .join(", ")
}

export const calculateTotalGas = (gasCosts: readonly number[]): number => {
    return gasCosts.reduce((sum, gas) => sum + gas, 0)
}

const escapeHtml = (text: string): string => {
    return text.replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("'", "&#039;")
}

const generateCodeWithHighlighting = (line: string, positions: readonly {readonly pos: number; readonly length: number}[]): string => {
    if (positions.length === 0) {
        return escapeHtml(line)
    }
    
    // Sort positions by start position to handle overlapping correctly
    const sortedPositions = [...positions]
        .filter(pos => pos.pos >= 0 && pos.length > 0 && pos.pos < line.length)
        .sort((a, b) => a.pos - b.pos)
    
    if (sortedPositions.length === 0) {
        return escapeHtml(line)
    }
    
    let result = ""
    let lastIndex = 0
    
    for (const pos of sortedPositions) {
        const start = Math.max(pos.pos, lastIndex)
        const end = Math.min(pos.pos + pos.length, line.length)
        
        // Skip if this position overlaps with the previous one
        if (start >= end) continue
        
        // Add text before highlight
        if (start > lastIndex) {
            result += escapeHtml(line.substring(lastIndex, start))
        }
        
        // Add highlighted text
        result += `<span class="code-highlight">${escapeHtml(line.substring(start, end))}</span>`
        
        lastIndex = end
    }
    
    // Add remaining text after last highlight
    if (lastIndex < line.length) {
        result += escapeHtml(line.substring(lastIndex))
    }
    
    return result
}

const generateLineHtml = (
    line: Line,
    index: number,
    maxGasPerLine: number,
    totalGas: number,
    options: HtmlOptions,
): string => {
    const {
        gasBackground = true,
        gasDetails = true,
    } = options

    const lineNumber = index + 1
    const className = line.info.$

    let gasHtml = `<div class="gas"></div>`
    let hitsHtml = `<div class="hits"></div>`
    let gasPercentStyle = ""
    let codeHtml = escapeHtml(line.line)

    if (line.info.$ === "Covered") {
        const gasInfo = line.info.gasCosts
        const detailedGasCost = formatGasCosts(gasInfo)
        const totalGasCost = calculateTotalGas(gasInfo)

        const gasPercentage = Math.sqrt(totalGasCost / maxGasPerLine) * 100
        const totalGasPercentage = totalGas === 0 ? 0 : (totalGasCost / totalGas) * 100

        if (gasBackground) {
            gasPercentStyle = ` style="--gas-percent:${gasPercentage.toFixed(4)}%" data-gas-percent="${totalGasPercentage.toFixed(2)}%"`
        }

        if (gasDetails) {
            gasHtml = `<div class="gas">
                <span class="gas-detailed">${detailedGasCost}</span>
                <span class="gas-sum">${totalGasCost}</span>
            </div>`
        }
        hitsHtml = `<div class="hits" title="Number of times executed">${line.info.hits}</div>`
        
        if (line.info.pos.length > 0) {
            codeHtml = generateCodeWithHighlighting(line.line, line.info.pos.map(funcLoc => ({
                pos: funcLoc.pos,
                length: funcLoc.length
            })))
        }
    }

    return `<div class="line ${className}" id="L${lineNumber}"${gasPercentStyle} data-line-number="${lineNumber}">
    <div class="line-number">${lineNumber}</div>
    ${gasHtml}
    ${hitsHtml}
    <pre>${codeHtml}</pre>
</div>`
}

const generateInstructionRowsHtml = (summary: CoverageSummary): string => {
    return summary.instructionStats
        .map(stat => {
            const percentValue = (stat.totalGas / summary.totalGas) * 100
            return `<tr>
                <td data-value="${stat.name}"><code>${stat.name}</code></td>
                <td data-value="${stat.totalGas}">${stat.totalGas}</td>
                <td data-value="${stat.totalHits}">${stat.totalHits}</td>
                <td data-value="${stat.avgGas}">${stat.avgGas}</td>
                <td data-value="${percentValue}">
                    <div class="percent-container">
                        <div class="percent-text">${percentValue.toFixed(2)}%</div>
                        <div class="percent-bar">
                            <div class="percent-fill" style="width: ${percentValue}%"></div>
                        </div>
                    </div>
                </td>
            </tr>`
        })
        .join("\n")
}

export const generateHtml = (lines: readonly Line[], options: HtmlOptions = {}): string => {
    const summary = generateCoverageSummary(lines)

    const maxGas = Math.max(
        ...lines.map(line =>
            line.info.$ === "Covered" ? line.info.gasCosts.reduce((sum, gas) => sum + gas, 0) : 0,
        ),
    )

    const htmlLines = lines
        .map((line, index) => generateLineHtml(line, index, maxGas, summary.totalGas, options))
        .join("\n")

    const templateData = {
        coverage_percentage: summary.coveragePercentage.toFixed(2),
        covered_lines: summary.coveredLines,
        total_lines: summary.totalLines,
        total_gas: summary.totalGas,
        total_hits: summary.totalHits,
        instruction_rows: generateInstructionRowsHtml(summary),
    }

    const summaryHtml = renderTemplate(templates.summary, templateData)

    return renderTemplate(templates.main, {
        SUMMARY_CONTENT: summaryHtml,
        CODE_CONTENT: htmlLines,
    })
}
