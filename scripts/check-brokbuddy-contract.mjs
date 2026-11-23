// Read-only compatibility check against an operator-selected local BrokBuddy
// checkout. Evaluate only the Zod expressions, without importing controllers,
// Prisma, application startup, environment files, or database connections.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import vm from 'node:vm';
import {buildContactInquiry} from '../src/lib/contact-workflow.mjs';
import {contactCases} from '../tests/contact-cases.mjs';
import {validateInquiry} from '../server/http.mjs';

const sourceRoot=process.argv[2] || process.env.BROKBUDDY_SOURCE_DIR;
if(!sourceRoot) throw new Error('Pass the local BrokBuddy source directory as an argument or BROKBUDDY_SOURCE_DIR.');
const backend=path.resolve(sourceRoot);
const require=createRequire(path.join(backend,'services/api/package.json'));
const {z}=require('zod');
const ts=require('typescript');
const files={
  notes:path.join(backend,'services/api/src/modules/lead/lead-special-notes.ts'),
  inquiry:path.join(backend,'services/api/src/modules/public/public.controller.ts'),
};
function initializer(source,filename,name) {
  const tree=ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true);
  let expression;
  for(const statement of tree.statements) if(ts.isVariableStatement(statement)) {
    for(const declaration of statement.declarationList.declarations) {
      if(ts.isIdentifier(declaration.name) && declaration.name.text===name) expression=declaration.initializer?.getText(tree);
    }
  }
  if(!expression) throw new Error(`Expected public contract expression is unavailable: ${name}`);
  return `const ${name}=${expression};`;
}
const [notes,inquiry]=await Promise.all([readFile(files.notes,'utf8'),readFile(files.inquiry,'utf8')]);
const expressions=[...['reservedLabel','text','scalar','specialNotesSchema'].map(name=>initializer(notes,files.notes,name)),initializer(inquiry,files.inquiry,'inquirySchema')].join('\n');
const javascript=ts.transpileModule(expressions+'\ninquirySchema;',{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
const schema=vm.runInNewContext(javascript,{z},{timeout:1000});
let combinations=0;
for(const {details,requirements} of contactCases()) {
  const payload=validateInquiry(buildContactInquiry(details,requirements));
  const parsed=schema.safeParse(payload);
  if(!parsed.success || JSON.stringify(parsed.data)!==JSON.stringify(payload)) {
    // Key ordering is not part of the contract. Check actual values below.
    if(!parsed.success) throw new Error('A generated contact workflow does not satisfy the BrokBuddy public enquiry schema.');
    for(const key of Object.keys(payload)) if(JSON.stringify(parsed.data[key])!==JSON.stringify(payload[key])) throw new Error(`BrokBuddy drops or transforms an expected contract field: ${key}`);
  }
  combinations++;
}
const report={combinations,compatible:true,sourceSchemaHash:createHash('sha256').update(expressions).digest('hex'),databaseAccess:false,networkRequests:0,productionWrites:0};
await mkdir('.verification/contact',{recursive:true});
await writeFile('.verification/contact/source-contract.json',JSON.stringify(report,null,2));
console.log(JSON.stringify(report));
