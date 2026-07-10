import sys

def main():
    with open('package.json', 'r') as f:
        lines = f.readlines()

    out = []
    i = 0
    while i < len(lines):
        line = lines[i]

        if "<<<<<<< HEAD" in line:
            # We want our updated devDependencies
            i += 1
            while "=======" not in lines[i]:
                out.append(lines[i])
                i += 1
            i += 1
            while ">>>>>>>" not in lines[i]:
                i += 1
            i += 1
            continue

        out.append(line)
        i += 1

    with open('package.json', 'w') as f:
        f.writelines(out)

if __name__ == '__main__':
    main()
