// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {withDatabase} from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import {of as of$} from 'rxjs';
import {distinctUntilChanged, switchMap} from 'rxjs/operators';

import JoinCallBanner from '@calls/components/join_call_banner/join_call_banner';
import {observeIsCallLimitRestricted} from '@calls/observers';
import {observeCallsState} from '@calls/state';
import {idsAreEqual} from '@calls/utils';
import {queryUsersById} from '@queries/servers/user';

import type {WithDatabaseArgs} from '@typings/database/database';

type OwnProps = {
    serverUrl: string;
    channelId: string;
}

const enhanced = withObservables(['serverUrl', 'channelId'], ({
    serverUrl,
    channelId,
    database,
}: OwnProps & WithDatabaseArgs) => {
    const callsState = observeCallsState(serverUrl);
    const participants = callsState.pipe(
        switchMap((state) => of$(state.calls[channelId])),
        distinctUntilChanged((prev, curr) => prev?.participants === curr?.participants), // Did the participants object ref change?
        switchMap((call) => (call ? of$(Object.keys(call.participants)) : of$([]))),
        distinctUntilChanged((prev, curr) => idsAreEqual(prev, curr)), // Continue only if we have a different set of participant ids
        switchMap((ids) => (ids.length > 0 ? queryUsersById(database, ids).observeWithColumns(['last_picture_update']) : of$([]))),
    );
    const channelCallStartTime = callsState.pipe(
        switchMap((cs) => of$(cs.calls[channelId]?.startTime || 0)),
        distinctUntilChanged(),
    );

    return {
        participants,
        channelCallStartTime,
        limitRestrictedInfo: observeIsCallLimitRestricted(database, serverUrl, channelId),
    };
});

export default withDatabase(enhanced(JoinCallBanner));
