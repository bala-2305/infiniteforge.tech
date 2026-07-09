const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const JavaScriptObfuscator = require('javascript-obfuscator');

const PUBLIC_DIR = path.join(__dirname, 'public');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const obfuscationOptions = {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 0.5,
    deadCodeInjection: true,
    deadCodeInjectionThreshold: 0.1,
    debugProtection: false,
    disableConsoleOutput: false,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: true,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    splitStringsChunkLength: 10,
    stringArray: true,
    stringArrayEncoding: ['base64', 'rc4'],
    stringArrayIndexShift: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: 'variable',
    stringArrayThreshold: 0.75,
    unicodeEscapeSequence: false
};

let processedCount = 0;
let fileCount = 0;

function obfuscateFile(filePath) {
    if (filePath.endsWith('.html')) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const $ = cheerio.load(content, { decodeEntities: false });
        let modified = false;

        $('script').each((i, elem) => {
            const scriptTag = $(elem);
            const src = scriptTag.attr('src');
            const type = scriptTag.attr('type');

            if (src || (type && type !== 'text/javascript' && type !== 'application/javascript')) {
                return;
            }

            const rawScript = scriptTag.html();
            if (rawScript && rawScript.trim().length > 0) {
                if (rawScript.includes('gtag(') || rawScript.includes('dataLayer.push')) {
                    return;
                }

                try {
                    const obfuscationResult = JavaScriptObfuscator.obfuscate(rawScript, obfuscationOptions);
                    scriptTag.html(obfuscationResult.getObfuscatedCode());
                    modified = true;
                } catch (e) {
                    console.error(`Error obfuscating script in ${filePath}:`, e.message);
                }
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, $.html());
            processedCount++;
            console.log(`[Obfuscated] ${path.basename(filePath)}`);
        } else {
            console.log(`[Skipped/No Inline JS] ${path.basename(filePath)}`);
        }
    }
}

console.log("Starting AST-Level Obfuscation...");

const targetArg = process.argv[2];
if (targetArg) {
    const targetPath = path.resolve(targetArg);
    if (fs.existsSync(targetPath)) {
        fileCount = 1;
        obfuscateFile(targetPath);
    } else {
        console.error(`Error: File or directory does not exist: ${targetArg}`);
        process.exit(1);
    }
} else {
    walkDir(PUBLIC_DIR, function(filePath) {
        if (filePath.endsWith('.html')) {
            fileCount++;
            obfuscateFile(filePath);
        }
    });
}

console.log(`\nObfuscation Complete!`);
console.log(`Successfully obfuscated scripts in ${processedCount} out of ${fileCount} target file(s).`);

