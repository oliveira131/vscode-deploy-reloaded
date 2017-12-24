/**
 * This file is part of the vscode-deploy-reloaded distribution.
 * Copyright (c) Marcel Joachim Kloubert.
 * 
 * vscode-deploy-reloaded is free software: you can redistribute it and/or modify  
 * it under the terms of the GNU Lesser General Public License as   
 * published by the Free Software Foundation, version 3.
 *
 * vscode-deploy-reloaded is distributed in the hope that it will be useful, but 
 * WITHOUT ANY WARRANTY; without even the implied warranty of 
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU 
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

const CoffeeScript = require('coffeescript');
import * as Path from 'path';
import * as deploy_compilers from '../compilers';
import * as deploy_helpers from '../helpers';


/**
 * CoffeeScript compile options.
 */
export interface CompileOptions extends deploy_compilers.CompileOptions {
    /**
     * The encoding of / for the files.
     */
    readonly encoding?: string;
    /**
     * The custom file extension for the output files to use.
     */
    readonly extension?: string;
}

/**
 * CoffeeScript compiler result.
 */
export interface CompileResult extends deploy_compilers.CompileResult {
    /** @inheritdoc */
    readonly messages: CompileResultMessage[];
}

/**
 * A CoffeeScript result message (entry).
 */
export interface CompileResultMessage extends deploy_compilers.CompileResultMessage {
}


/**
 * Compiles CoffeeScript files.
 * 
 * @param {CompileOptions} [compileOpts] The custom options for the compilation.
 * 
 * @return {Promise<CompileResult>} The promise with the result.
 */
export async function compile(compileOpts?: CompileOptions) {
    compileOpts = compileOpts || <any>{};

    const WORKSPACE = compileOpts.workspace;

    const RESULT: CompileResult = {
        messages: [],
    };
    
    const OPTS = compileOpts.options || {};

    const FILES_TO_COMPILE = await deploy_compilers.collectFiles(
        compileOpts,
        '**/*.coffee',
    );

    let enc = deploy_helpers.normalizeString(compileOpts.encoding);
    if ('' === enc) {
        enc = 'utf8';
    }

    let outExt = deploy_helpers.toStringSafe(compileOpts.extension).trim();
    if ('' === outExt) {
        outExt = 'js';
    }

    for (const FTC of FILES_TO_COMPILE) {
        let msg: CompileResultMessage;
        
        try {
            let outDir = deploy_compilers.getOutputDirectory(compileOpts);
            if (false === outDir) {
                outDir = Path.dirname(FTC);
            }

            const EXT = Path.extname(FTC);
            const FILENAME = Path.basename(FTC, EXT);

            const OUTPUT_FILE = Path.join(outDir,
                                          FILENAME + '.' + outExt);

            const JS_CODE: string = CoffeeScript.compile((await deploy_helpers.readFile(FTC)).toString(enc),
                                                         OPTS);

            await deploy_helpers.writeFile(OUTPUT_FILE,
                                           new Buffer(JS_CODE, enc));
        }
        catch (e) {
            msg = {
                category: deploy_compilers.CompileResultMessageCategory.Error,
                compiler: deploy_compilers.Compiler.CoffeeScript,
                file: FTC,
                message: deploy_helpers.toStringSafe(e),
            };
        }

        if (msg) {
            RESULT.messages.push(msg);
        }
    }

    return RESULT;
}
