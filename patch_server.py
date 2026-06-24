import sys

def main():
    with open('src/api/server.ts', 'r') as f:
        lines = f.readlines()

    out = []
    i = 0
    while i < len(lines):
        line = lines[i]

        # Add imports at the top
        if "import express" in line:
            out.append(line)
            out.append('import { createTreasuryRouter } from "./routes/treasury";\n')
            out.append('import { createGovernanceRouter } from "./routes/governance";\n')
            out.append('import { TreasuryManager } from "../core/treasury";\n')
            i += 1
            continue

        # Remove old governance routes manually with exact string matching logic to avoid syntax errors
        if "app.post('/governance/transition-cycle', (req: Request, res: Response) => {" in line:
            braces = 0
            while i < len(lines):
                braces += lines[i].count('{')
                braces -= lines[i].count('}')
                i += 1
                if braces == 0:
                    break
            continue

        if "app.get('/governance/cycles', (req: Request, res: Response) => {" in line:
            braces = 0
            while i < len(lines):
                braces += lines[i].count('{')
                braces -= lines[i].count('}')
                i += 1
                if braces == 0:
                    break
            continue

        if "app.get('/governance/cycle', (req: Request, res: Response) => {" in line:
            braces = 0
            while i < len(lines):
                braces += lines[i].count('{')
                braces -= lines[i].count('}')
                i += 1
                if braces == 0:
                    break
            continue

        if "app.get('/governance/trends', (req: Request, res: Response) => {" in line:
            braces = 0
            while i < len(lines):
                braces += lines[i].count('{')
                braces -= lines[i].count('}')
                i += 1
                if braces == 0:
                    break
            continue

        out.append(line)
        i += 1

    final_out = []
    inserted = False
    for line in out:
        if "app.get('/summary'," in line and not inserted:
            final_out.append("\nconst treasuryManager = new TreasuryManager(globalStore);\n")
            final_out.append("app.use('/api/treasury', authenticateToken, createTreasuryRouter(treasuryManager));\n")
            final_out.append("app.use('/api/governance', authenticateToken, createGovernanceRouter());\n\n")
            inserted = True
        final_out.append(line)

    with open('src/api/server.ts', 'w') as f:
        f.writelines(final_out)

if __name__ == '__main__':
    main()
