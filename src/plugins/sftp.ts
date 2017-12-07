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

import * as deploy_clients_sftp from '../clients/sftp';
import * as deploy_files from '../files';
import * as deploy_helpers from '../helpers';
import * as deploy_log from '../log';
import * as deploy_plugins from '../plugins';
import * as deploy_targets from '../targets';
import * as FS from 'fs';
import * as Moment from 'moment';
import * as OS from 'os';
import * as Path from 'path';


interface SFTPContext extends deploy_plugins.AsyncFileClientPluginContext<SFTPTarget,
                                                                          deploy_clients_sftp.SFTPClient> {
}

/**
 * A 'sftp' target.
 */
export interface SFTPTarget extends deploy_targets.Target {
    /**
     * Name or path to ssh-agent for ssh-agent-based user authentication.
     */
    readonly agent?: string;
    /**
     * Set to (true) to use OpenSSH agent forwarding (auth-agent@openssh.com) for the life of the connection.
     * 'agent' property must also be set to use this feature.
     */
    readonly agentForward?: boolean;
    /**
     * Show debug output or not.
     */
    readonly debug?: boolean;
    /**
     * The remote directory.
     */
    readonly dir?: string;
    /**
     * The algorithm to use to verify the fingerprint of a host.
     */
    readonly hashAlgorithm?: string;
    /**
     * One or more hashes to verify.
     */
    readonly hashes?: string | string[];
    /**
     * The hostname
     */
    readonly host?: string;
    /**
     * The password.
     */
    readonly password?: string;
    /**
     * The custom TCP port.
     */
    readonly port?: number;
    /**
     * Path to the private key file.
     */
    readonly privateKey?: string;
    /**
     * The passphrase for the key file, if needed.
     */
    readonly privateKeyPassphrase?: string;
    /**
     * How long (in milliseconds) to wait for the SSH handshake to complete.
     */
    readonly readyTimeout?: number;
    /**
     * Try keyboard-interactive user authentication if primary user authentication method fails.
     */
    readonly tryKeyboard?: boolean;
    /**
     * The username.
     */
    readonly user?: string;
}


class SFTPPlugin extends deploy_plugins.AsyncFileClientPluginBase<SFTPTarget,
                                                                  deploy_clients_sftp.SFTPClient,
                                                                  SFTPContext> {
    public async createContext(target: SFTPTarget): Promise<SFTPContext> {
        let agent = deploy_helpers.toStringSafe(target.agent);
        agent = target.__workspace.replaceWithValues(agent);
        if (deploy_helpers.isEmptyString(agent)) {
            agent = undefined;
        }
        else {
            const AGENT_PATH = await target.__workspace.getExistingSettingPath(agent);
            if (false !== AGENT_PATH) {
                agent = AGENT_PATH;
            }
        }

        let privateKeyFile: string | false = deploy_helpers.toStringSafe(target.privateKey);
        privateKeyFile = target.__workspace.replaceWithValues(privateKeyFile);
        if (deploy_helpers.isEmptyString(privateKeyFile)) {
            privateKeyFile = undefined;
        }
        else {
            privateKeyFile = await target.__workspace.getExistingSettingPath(privateKeyFile);
        }

        if (false === privateKeyFile) {
            //TODO: translate
            throw new Error(`Private key file '${target.privateKey}' not found!`);
        }

        return {
            client: await deploy_clients_sftp.openConnection({
                agent: agent,
                debug: target.debug,
                hashAlgorithm: target.hashAlgorithm,
                hashes: target.hashes,
                host: target.host,
                password: target.password,
                port: target.port,
                privateKey: privateKeyFile,
                privateKeyPassphrase: target.privateKeyPassphrase,
                readyTimeout: target.readyTimeout,
                user: target.user,
            }),
            target: target,
        };
    }
}

/**
 * Creates a new instance of that plugin.
 * 
 * @param {deploy_plugins.PluginContext} context The context for the plugin.
 * 
 * @return {deploy_plugins.Plugin} The new plugin.
 */
export function createPlugins(context: deploy_plugins.PluginContext) {
    return new SFTPPlugin(context);
}
