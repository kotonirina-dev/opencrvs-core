/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * OpenCRVS is also distributed under the terms of the Civil Registration
 * & Healthcare Disclaimer located at http://opencrvs.org/license.
 *
 * Copyright (C) The OpenCRVS Authors located at https://github.com/opencrvs/opencrvs-core/blob/master/AUTHORS.
 */
import { upsertEvent } from '@search/features/registration/marriage/service'
import { logger } from '@search/logger'
import { internal } from '@hapi/boom'
import * as Hapi from '@hapi/hapi'

export async function marriageEventHandler(
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) {
  try {
    await upsertEvent(request)
  } catch (error) {
    logger.error(`Search/marriageEventHandler: error: ${error}`)
    return internal(error)
  }

  return h.response().code(200)
}
