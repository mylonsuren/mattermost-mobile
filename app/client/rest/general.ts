// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {buildQueryString} from '@utils/helpers';

import {PER_PAGE_DEFAULT} from './constants';
import ClientError from './error';

type PoliciesResponse<T> = {
    policies: T[];
    total_count: number;
}

export interface ClientGeneralMix {
    getOpenGraphMetadata: (url: string) => Promise<any>;
    ping: (deviceId?: string, timeoutInterval?: number) => Promise<any>;
    logClientError: (message: string, level?: string) => Promise<any>;
    getClientConfigOld: () => Promise<ClientConfig>;
    getClientLicenseOld: () => Promise<ClientLicense>;
    getTimezones: () => Promise<string[]>;
    getGlobalDataRetentionPolicy: () => Promise<GlobalDataRetentionPolicy>;
    getTeamDataRetentionPolicies: (userId: string, page?: number, perPage?: number) => Promise<PoliciesResponse<TeamDataRetentionPolicy>>;
    getChannelDataRetentionPolicies: (userId: string, page?: number, perPage?: number) => Promise<PoliciesResponse<ChannelDataRetentionPolicy>>;
    getRolesByNames: (rolesNames: string[]) => Promise<Role[]>;
    getRedirectLocation: (urlParam: string) => Promise<Record<string, string>>;
}

const ClientGeneral = (superclass: any) => class extends superclass {
    getOpenGraphMetadata = async (url: string) => {
        return this.doFetch(
            `${this.urlVersion}/opengraph`,
            {method: 'post', body: {url}},
        );
    };

    ping = async (deviceId?: string, timeoutInterval?: number) => {
        let url = `${this.urlVersion}/system/ping?time=${Date.now()}`;
        if (deviceId) {
            url = `${url}&device_id=${deviceId}`;
        }
        return this.doFetch(
            url,
            {method: 'get', timeoutInterval},
            false,
        );
    };

    logClientError = async (message: string, level = 'ERROR') => {
        const url = `${this.urlVersion}/logs`;

        if (!this.enableLogging) {
            throw new ClientError(this.client.baseUrl, {
                message: 'Logging disabled.',
                url,
            });
        }

        return this.doFetch(
            url,
            {method: 'post', body: {message, level}},
        );
    };

    getClientConfigOld = async () => {
        return this.doFetch(
            `${this.urlVersion}/config/client?format=old`,
            {method: 'get'},
        );
    };

    getClientLicenseOld = async () => {
        return this.doFetch(
            `${this.urlVersion}/license/client?format=old`,
            {method: 'get'},
        );
    };

    getTimezones = async () => {
        return this.doFetch(
            `${this.getTimezonesRoute()}`,
            {method: 'get'},
        );
    };

    getGlobalDataRetentionPolicy = () => {
        return this.doFetch(
            `${this.getGlobalDataRetentionRoute()}/policy`,
            {method: 'get'},
        );
    };

    getTeamDataRetentionPolicies = (userId: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getGranularDataRetentionRoute(userId)}/team_policies${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getChannelDataRetentionPolicies = (userId: string, page = 0, perPage = PER_PAGE_DEFAULT) => {
        return this.doFetch(
            `${this.getGranularDataRetentionRoute(userId)}/channel_policies${buildQueryString({page, per_page: perPage})}`,
            {method: 'get'},
        );
    };

    getRolesByNames = async (rolesNames: string[]) => {
        return this.doFetch(
            `${this.getRolesRoute()}/names`,
            {method: 'post', body: rolesNames},
        );
    };

    getRedirectLocation = async (urlParam: string) => {
        if (!urlParam.length) {
            return Promise.resolve();
        }
        const url = `${this.getRedirectLocationRoute()}${buildQueryString({url: urlParam})}`;
        return this.doFetch(url, {method: 'get'});
    };
};

export default ClientGeneral;
