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
import {
  buildFHIRBundle,
  updateFHIRTaskBundle,
  taskBundleWithExtension,
  checkUserAssignment
} from '@gateway/features/registration/fhir-builders'
import {
  FHIR_SPECIFICATION_URL,
  FHIR_OBSERVATION_CATEGORY_URL,
  EVENT_TYPE
} from '@gateway/features/fhir/constants'
import {
  BIRTH_TYPE_CODE,
  BODY_WEIGHT_CODE,
  BIRTH_ATTENDANT_CODE,
  NUMBER_BORN_ALIVE_CODE,
  NUMBER_FOEATAL_DEATH_CODE,
  LAST_LIVE_BIRTH_CODE
} from '@gateway/features/fhir/templates'
import * as _ from 'lodash'
import { mockTask } from '@gateway/utils/testUtils'
import { findExtension } from '@gateway/features/fhir/utils'
import { readFileSync } from 'fs'
import * as jwt from 'jsonwebtoken'

import { IAuthHeader } from '@opencrvs/commons'

import * as fetchMock from 'jest-fetch-mock'
import {
  Extension,
  isTask,
  TrackingID,
  URLReference,
  OPENCRVS_SPECIFICATION_URL,
  ResourceIdentifier
} from '@opencrvs/commons/types'
import {
  GQLAttachmentInputStatus,
  GQLBirthRegistrationInput
} from '@gateway/graphql/schema'

const fetch = fetchMock as fetchMock.FetchMock
type AuthHeader = { Authorization?: string } & IAuthHeader
test('should build a minimal FHIR registration document without error', async () => {
  fetch.mockResponse(
    JSON.stringify({
      refUrl: '/ocrvs/3d3623fa-333d-11ed-a261-0242ac120002.png'
    })
  )
  const fhir: any = await buildFHIRBundle(
    {
      mother: {
        _fhirID: '8f18a6ea-89d1-4b03-80b3-57509a7eeb39',
        identifier: [{ id: '123456', type: 'OTHER', otherType: 'Custom type' }],
        gender: 'female',
        birthDate: '2000-01-28',
        maritalStatus: 'MARRIED',
        name: [{ firstNames: 'Jane', familyName: 'Doe', use: 'en' }],
        multipleBirth: 1,
        dateOfMarriage: '2014-01-28',
        nationality: ['BGD'],
        educationalAttainment: 'UPPER_SECONDARY_ISCED_3',
        occupation: 'Mother Occupation',
        reasonNotApplying: ''
      },
      father: {
        _fhirID: '8f18a6ea-89d1-4b03-80b3-57509a7eeb40',
        gender: 'male',
        name: [],
        telecom: [{ use: 'mobile', system: 'phone', value: '0171111111' }],
        maritalStatus: 'MARRIED',
        birthDate: '2000-09-28',
        multipleBirth: 2,
        address: [
          {
            use: 'home',
            type: 'both',
            line: ['2760 Mlosi Street', 'Wallacedene'],
            district: 'Kraaifontein',
            state: 'Western Cape',
            city: 'Cape Town',
            postalCode: '7570',
            country: 'BGD'
          },
          {
            use: 'home',
            type: 'both',
            line: ['40 Orbis Wharf', 'Wallacedene'],
            text: 'Optional address text',
            district: 'Kraaifontein',
            state: 'Western Cape',
            city: 'Cape Town',
            postalCode: '7570',
            country: 'BGD'
          }
        ],
        photo: [
          {
            contentType: 'image/jpeg',
            data: '123456'
          }
        ],
        dateOfMarriage: '2014-01-28',
        nationality: ['BGD'],
        educationalAttainment: 'UPPER_SECONDARY_ISCED_3',
        occupation: 'Father Occupation',
        reasonNotApplying: ''
      },
      child: {
        _fhirID: '8f18a6ea-89d1-4b03-80b3-57509a7eeb41',
        gender: 'male',
        name: [],
        birthDate: '2018-01-28',
        maritalStatus: 'NOT_STATED',
        multipleBirth: 3,
        dateOfMarriage: '',
        nationality: ['BGD'],
        educationalAttainment: 'NO_SCHOOLING'
      },
      registration: {
        _fhirID: '8f18a6ea-89d1-4b03-80b3-57509a7eebce',
        informantType: 'MOTHER',
        contactPhoneNumber: '01733333333',
        paperFormID: '12345678',
        draftId: '8f18a6ea-89d1-4b03-80b3-57509a7eebce',
        trackingId: 'B123456',
        registrationNumber: '201923324512345671',
        inCompleteFields:
          'child/child-view-group/placeOfBirth,' +
          'mother/mother-view-group/iDType,' +
          'mother/mother-view-group/iD,' +
          'mother/mother-view-group/familyName,' +
          'mother/mother-view-group/familyNameEng',
        status: [
          {
            comments: [
              {
                comment: 'This is just a test data',
                createdAt: '2018-10-31T09:40:05+10:00'
              }
            ],
            timestamp: '2018-10-31T09:40:05+10:00',
            timeLoggedMS: 1234
          }
        ],
        attachments: [
          {
            _fhirID: '8f18a6ea-89d1-4b03-80b3-57509a7eebce11',
            contentType: 'image/jpeg',
            data: 'SampleData',
            status: 'final',
            originalFileName: 'original.jpg',
            systemFileName: 'system.jpg',
            type: 'NATIONAL_ID',
            createdAt: '2018-10-21'
          },
          {
            _fhirID: '8f18a6ea-89d1-4b03-80b3-57509a7eebce22',
            contentType: 'image/png',
            data: 'ExampleData',
            status: 'amended' as GQLAttachmentInputStatus,
            originalFileName: 'original.png',
            systemFileName: 'system.png',
            type: 'PASSPORT',
            createdAt: '2018-10-22',
            subject: 'MOTHER'
          }
        ],
        certificates: [
          {
            collector: {
              relationship: 'OTHER',
              affidavit: [
                {
                  contentType: 'image/jpg',
                  data: 'data:image/png;base64,2324256'
                }
              ],
              name: [{ firstNames: 'Doe', familyName: 'Jane', use: 'en' }],
              identifier: [{ id: '123456', type: 'PASSPORT' }]
            },
            hasShowedVerifiedDocument: true,
            payments: [
              {
                paymentId: '1234',
                type: 'MANUAL',
                total: 50,
                amount: 50,
                outcome: 'COMPLETED',
                date: '2018-10-22'
              }
            ],
            data: 'data:image/png;base64,2324256'
          }
        ]
      },
      eventLocation: {
        type: 'PRIVATE_HOME',
        partOf: 'Location/456',
        address: {
          country: '789',
          state: '101112',
          district: '131415',
          postalCode: 'sw11',
          line: [
            'addressLine1',
            'addressLine1UrbanOption',
            'addressLine2',
            '123',
            '456',
            '789'
          ]
        }
      },
      birthType: 'SINGLE',
      weightAtBirth: 3,
      attendantAtBirth: 'NURSE',
      childrenBornAliveToMother: 2,
      foetalDeathsToMother: 0,
      lastPreviousLiveBirth: '2014-01-28',
      createdAt: '2018-10-31T09:45:05+10:00',
      _fhirIDMap: {
        composition: '8f18a6ea-89d1-4b03-80b3-57509a7eebcedsd',
        encounter: '8f18a6ea-89d1-4b03-80b3-57509a7eebce-dsakelske',
        observation: {
          birthType: '8f18a6ea-89d1-4b03-80b3-57509a7eebce-dh3283',
          weightAtBirth: '8f18a6ea-89d1-4b03-80b3-57509a7eebce-dh3293',
          attendantAtBirth: '8f18a6ea-89d1-4b03-80b3-57509a7eebce-dh3203',
          childrenBornAliveToMother:
            '8f18a6ea-89d1-4b03-80b3-57509a7eebce-dh3283kdsoe',
          foetalDeathsToMother: '8f18a6ea-89d1-4b03-80b3-57509a7eebce-kdsa2324',
          lastPreviousLiveBirth:
            '8f18a6ea-89d1-4b03-80b3-57509a7eebce-dsa23324lsdafk'
        }
      }
    } as GQLBirthRegistrationInput,
    'BIRTH' as EVENT_TYPE,
    {} as any
  )
  expect(fhir).toBeDefined()
  expect(fhir.entry[0].resource.section.length).toBe(7)
  expect(fhir.entry[0].resource.date).toBeDefined()
  expect(fhir.entry[0].resource.id).toBe(
    '8f18a6ea-89d1-4b03-80b3-57509a7eebcedsd'
  )

  expect(fhir.entry[1].resource.gender).toBe('female')
  expect(fhir.entry[1].resource.id).toBe('8f18a6ea-89d1-4b03-80b3-57509a7eeb39')
  expect(fhir.entry[1].resource.name[0].given[0]).toBe('Jane')
  expect(fhir.entry[1].resource.name[0].family[0]).toBe('Doe')
  expect(fhir.entry[1].resource.name[0].use).toBe('en')
  expect(fhir.entry[1].resource.identifier[0].value).toBe('123456')
  expect(fhir.entry[1].resource.identifier[0].type.coding[0].code).toBe('OTHER')
  expect(fhir.entry[1].resource.identifier[0].otherType).toBe('Custom type')
  expect(fhir.entry[1].resource.birthDate).toBe('2000-01-28')
  expect(fhir.entry[1].resource.maritalStatus.text).toBe('MARRIED')
  expect(fhir.entry[1].resource.maritalStatus.coding[0].code).toBe('M')
  expect(fhir.entry[1].resource.multipleBirthInteger).toBe(1)
  expect(fhir.entry[1].resource.extension[0].valueDateTime).toBe('2014-01-28')
  expect(fhir.entry[1].resource.extension[1]).toEqual({
    url: `${FHIR_SPECIFICATION_URL}patient-nationality`,
    extension: [
      {
        url: 'code',
        valueCodeableConcept: {
          coding: [{ system: 'urn:iso:std:iso:3166', code: 'BGD' }]
        }
      },
      {
        url: 'period',
        valuePeriod: {
          start: '',
          end: ''
        }
      }
    ]
  })
  expect(fhir.entry[1].resource.extension[2].valueString).toBe(
    'UPPER_SECONDARY_ISCED_3'
  )
  expect(fhir.entry[1].resource.extension[2].url).toBe(
    `${OPENCRVS_SPECIFICATION_URL}extension/educational-attainment`
  )
  expect(fhir.entry[1].resource.extension[3].valueString).toBe(
    'Mother Occupation'
  )
  expect(fhir.entry[1].resource.extension[3].url).toBe(
    `${OPENCRVS_SPECIFICATION_URL}extension/patient-occupation`
  )
  expect(fhir.entry[1].resource.extension[0].valueDateTime).toBe('2014-01-28')

  expect(fhir.entry[2].resource.id).toBe('8f18a6ea-89d1-4b03-80b3-57509a7eeb40')
  expect(fhir.entry[2].resource.gender).toBe('male')
  expect(fhir.entry[2].resource.telecom[0].value).toBe('0171111111')
  expect(fhir.entry[2].resource.telecom[0].system).toBe('phone')
  expect(fhir.entry[2].resource.telecom[0].use).toBe('mobile')
  expect(fhir.entry[2].resource.birthDate).toBe('2000-09-28')
  expect(fhir.entry[2].resource.maritalStatus.text).toBe('MARRIED')
  expect(fhir.entry[2].resource.maritalStatus.coding[0].code).toBe('M')
  expect(fhir.entry[2].resource.multipleBirthInteger).toBe(2)
  expect(fhir.entry[2].resource.address[0].use).toBe('home')
  expect(fhir.entry[2].resource.address[0].line[0]).toBe('2760 Mlosi Street')
  expect(fhir.entry[2].resource.address[1].line[0]).toBe('40 Orbis Wharf')
  expect(fhir.entry[2].resource.address[1].text).toBe('Optional address text')
  expect(fhir.entry[2].resource.extension[1]).toEqual({
    url: `${FHIR_SPECIFICATION_URL}patient-nationality`,
    extension: [
      {
        url: 'code',
        valueCodeableConcept: {
          coding: [{ system: 'urn:iso:std:iso:3166', code: 'BGD' }]
        }
      },
      {
        url: 'period',
        valuePeriod: {
          start: '',
          end: ''
        }
      }
    ]
  })
  expect(fhir.entry[2].resource.extension[2].valueString).toBe(
    'UPPER_SECONDARY_ISCED_3'
  )
  expect(fhir.entry[2].resource.extension[2].url).toBe(
    `${OPENCRVS_SPECIFICATION_URL}extension/educational-attainment`
  )
  expect(fhir.entry[3].resource.id).toBe('8f18a6ea-89d1-4b03-80b3-57509a7eeb41')
  expect(fhir.entry[3].resource.gender).toBe('male')
  expect(fhir.entry[3].resource.birthDate).toBe('2018-01-28')
  expect(fhir.entry[3].resource.maritalStatus.text).toBe('NOT_STATED')
  expect(fhir.entry[3].resource.maritalStatus.coding[0].code).toBe('UNK')
  expect(fhir.entry[3].resource.multipleBirthInteger).toBe(3)

  expect(fhir.entry[3].resource.extension[0].valueDateTime).toBe('')
  expect(fhir.entry[3].resource.extension[1]).toEqual({
    url: `${FHIR_SPECIFICATION_URL}patient-nationality`,
    extension: [
      {
        url: 'code',
        valueCodeableConcept: {
          coding: [{ system: 'urn:iso:std:iso:3166', code: 'BGD' }]
        }
      },
      {
        url: 'period',
        valuePeriod: {
          start: '',
          end: ''
        }
      }
    ]
  })
  expect(fhir.entry[3].resource.extension[2].valueString).toBe('NO_SCHOOLING')
  expect(fhir.entry[3].resource.extension[2].url).toBe(
    `${OPENCRVS_SPECIFICATION_URL}extension/educational-attainment`
  )

  /* RelatedPerson Test cases */

  /* Task Test cases */
  expect(fhir.entry[4].resource.resourceType).toBe('Task')
  expect(fhir.entry[4].resource.id).toBe('8f18a6ea-89d1-4b03-80b3-57509a7eebce')
  expect(fhir.entry[4].resource.code).toEqual({
    coding: [
      {
        system: `${OPENCRVS_SPECIFICATION_URL}types`,
        code: 'BIRTH'
      }
    ]
  })
  expect(fhir.entry[4].resource.extension[0]).toEqual({
    url: `${OPENCRVS_SPECIFICATION_URL}extension/contact-person`,
    valueString: 'MOTHER'
  })
  expect(fhir.entry[4].resource.extension[1]).toEqual({
    url: `${OPENCRVS_SPECIFICATION_URL}extension/contact-person-phone-number`,
    valueString: '01733333333'
  })
  expect(fhir.entry[4].resource.extension[3]).toEqual({
    url: `${OPENCRVS_SPECIFICATION_URL}extension/timeLoggedMS`,
    valueInteger: 1234
  })
  expect(fhir.entry[4].resource.status).toEqual('draft')
  expect(fhir.entry[4].resource.lastModified).toEqual(
    '2018-10-31T09:45:05+10:00'
  )
  expect(fhir.entry[4].resource.note[0]).toEqual({
    text: 'This is just a test data',
    time: '2018-10-31T09:40:05+10:00'
  })
  expect(fhir.entry[4].resource.identifier).toEqual([
    { system: 'http://opencrvs.org/specs/id/paper-form-id', value: '12345678' },
    {
      system: 'http://opencrvs.org/specs/id/draft-id',
      value: '8f18a6ea-89d1-4b03-80b3-57509a7eebce'
    },
    {
      system: 'http://opencrvs.org/specs/id/birth-tracking-id',
      value: 'B123456'
    },
    {
      system: 'http://opencrvs.org/specs/id/birth-registration-number',
      value: '201923324512345671'
    }
  ])
  // Attachment Test cases
  expect(fhir.entry[6].resource.id).toBe(
    '8f18a6ea-89d1-4b03-80b3-57509a7eebce11'
  )
  expect(fhir.entry[6].resource.docStatus).toBe('final')
  expect(fhir.entry[6].resource.created).toBe('2018-10-21')
  expect(fhir.entry[6].resource.type).toEqual({
    coding: [
      {
        system: 'http://opencrvs.org/specs/supporting-doc-type',
        code: 'NATIONAL_ID'
      }
    ]
  })
  expect(fhir.entry[6].resource.content).toEqual([
    {
      attachment: {
        contentType: 'image/jpeg',
        data: 'SampleData'
      }
    }
  ])
  expect(fhir.entry[6].resource.identifier).toEqual([
    {
      system: 'http://opencrvs.org/specs/id/original-file-name',
      value: 'original.jpg'
    },
    {
      system: 'http://opencrvs.org/specs/id/system-file-name',
      value: 'system.jpg'
    }
  ])
  expect(fhir.entry[7].resource.id).toBe(
    '8f18a6ea-89d1-4b03-80b3-57509a7eebce22'
  )
  expect(fhir.entry[7].resource.docStatus).toBe('approved')
  expect(fhir.entry[7].resource.created).toBe('2018-10-22')
  expect(fhir.entry[7].resource.type).toEqual({
    coding: [
      {
        system: 'http://opencrvs.org/specs/supporting-doc-type',
        code: 'PASSPORT'
      }
    ]
  })
  expect(fhir.entry[7].resource.identifier).toEqual([
    {
      system: 'http://opencrvs.org/specs/id/original-file-name',
      value: 'original.png'
    },
    {
      system: 'http://opencrvs.org/specs/id/system-file-name',
      value: 'system.png'
    }
  ])
  expect(fhir.entry[7].resource.content).toEqual([
    {
      attachment: {
        contentType: 'image/png',
        data: 'ExampleData'
      }
    }
  ])
  expect(fhir.entry[7].resource.subject).toEqual({
    display: 'MOTHER'
  })
  // Certificate collection
  expect(fhir.entry[8].resource.resourceType).toBe('DocumentReference')

  expect(fhir.entry[8].resource.type).toEqual({
    coding: [
      {
        system: 'http://opencrvs.org/specs/certificate-type',
        code: 'BIRTH'
      }
    ]
  })
  expect(fhir.entry[8].resource.extension).toEqual([
    {
      url: 'http://opencrvs.org/specs/extension/collector',
      valueReference: {
        reference: fhir.entry[9].fullUrl
      }
    },
    {
      url: 'http://opencrvs.org/specs/extension/hasShowedVerifiedDocument',
      valueBoolean: true
    },
    {
      url: 'http://opencrvs.org/specs/extension/payment',
      valueReference: {
        reference: fhir.entry[11].fullUrl
      }
    }
  ])
  expect(fhir.entry[8].resource.content).toEqual([
    {
      attachment: {
        contentType: 'application/pdf',
        data: '/ocrvs/3d3623fa-333d-11ed-a261-0242ac120002.png'
      }
    }
  ])

  //  Affidavit checking
  expect(fhir.entry[9].resource.extension).toEqual([
    {
      url: 'http://opencrvs.org/specs/extension/relatedperson-affidavittype',
      valueAttachment: {
        contentType: 'image/jpg',
        data: '/ocrvs/3d3623fa-333d-11ed-a261-0242ac120002.png'
      }
    }
  ])

  expect(fhir.entry[9].resource.resourceType).toBe('RelatedPerson')
  expect(fhir.entry[9].resource.relationship).toEqual({
    coding: [
      {
        system: 'http://hl7.org/fhir/ValueSet/relatedperson-relationshiptype',
        code: 'OTHER'
      }
    ]
  })
  expect(fhir.entry[9].resource.patient.reference).toBe(fhir.entry[10].fullUrl)

  expect(fhir.entry[10].resource.resourceType).toBe('Patient')
  expect(fhir.entry[10].resource.name).toEqual([
    {
      use: 'en',
      family: ['Jane'],
      given: ['Doe']
    }
  ])
  expect(fhir.entry[10].resource.identifier).toEqual([
    {
      id: '123456',
      type: {
        coding: [
          {
            system: 'http://opencrvs.org/specs/identifier-type',
            code: 'PASSPORT'
          }
        ]
      }
    }
  ])

  expect(fhir.entry[11].resource.resourceType).toBe('PaymentReconciliation')
  expect(fhir.entry[11].resource.status).toBe('active')
  expect(fhir.entry[11].resource.identifier).toEqual([
    {
      system: 'http://opencrvs.org/specs/id/payment-id',
      value: '1234'
    }
  ])
  expect(fhir.entry[11].resource.total).toBe(50)
  expect(fhir.entry[11].resource.outcome).toEqual({
    coding: [{ code: 'COMPLETED' }]
  })
  expect(fhir.entry[11].resource.detail).toEqual([
    {
      type: { coding: [{ code: 'MANUAL' }] },
      amount: 50,
      date: '2018-10-22'
    }
  ])

  // Encounter
  expect(fhir.entry[12].resource.id).toBe(
    '8f18a6ea-89d1-4b03-80b3-57509a7eebce-dsakelske'
  )
  expect(fhir.entry[12].resource.resourceType).toBe('Encounter')

  expect(fhir.entry[13].resource.resourceType).toBe('Location')
  expect(fhir.entry[13].resource.partOf.reference).toBe('Location/456')
  expect(fhir.entry[13].resource.address.country).toBe('789')
  expect(fhir.entry[13].resource.address.state).toBe('101112')
  expect(fhir.entry[13].resource.address.district).toBe('131415')
  expect(fhir.entry[13].resource.address.postalCode).toBe('sw11')

  // Observation
  expect(fhir.entry[14].resource.id).toBe(
    '8f18a6ea-89d1-4b03-80b3-57509a7eebce-dh3283'
  )
  expect(fhir.entry[14].resource.valueQuantity.value).toBe('SINGLE')
  expect(fhir.entry[14].resource.context.reference).toEqual(
    fhir.entry[12].fullUrl
  )
  expect(fhir.entry[14].resource.category).toEqual([
    {
      coding: [
        {
          system: FHIR_OBSERVATION_CATEGORY_URL,
          code: 'procedure',
          display: 'Procedure'
        }
      ]
    }
  ])
  expect(fhir.entry[14].resource.code.coding).toEqual([
    {
      system: 'http://loinc.org',
      code: BIRTH_TYPE_CODE,
      display: 'Birth plurality of Pregnancy'
    }
  ])
  expect(fhir.entry[15].resource.id).toBe(
    '8f18a6ea-89d1-4b03-80b3-57509a7eebce-dh3293'
  )
  expect(fhir.entry[15].resource.valueQuantity.value).toBe(3)
  expect(fhir.entry[15].resource.context.reference).toEqual(
    fhir.entry[12].fullUrl
  )
  expect(fhir.entry[15].resource.category).toEqual([
    {
      coding: [
        {
          system: FHIR_OBSERVATION_CATEGORY_URL,
          code: 'vital-signs',
          display: 'Vital Signs'
        }
      ]
    }
  ])
  expect(fhir.entry[15].resource.code.coding).toEqual([
    {
      system: 'http://loinc.org',
      code: BODY_WEIGHT_CODE,
      display: 'Body weight Measured'
    }
  ])
  expect(fhir.entry[16].resource.id).toBe(
    '8f18a6ea-89d1-4b03-80b3-57509a7eebce-dh3203'
  )
  expect(fhir.entry[16].resource.valueString).toBe('NURSE')
  expect(fhir.entry[16].resource.context.reference).toEqual(
    fhir.entry[12].fullUrl
  )
  expect(fhir.entry[16].resource.category).toEqual([
    {
      coding: [
        {
          system: FHIR_OBSERVATION_CATEGORY_URL,
          code: 'procedure',
          display: 'Procedure'
        }
      ]
    }
  ])
  expect(fhir.entry[16].resource.code.coding).toEqual([
    {
      system: 'http://loinc.org',
      code: BIRTH_ATTENDANT_CODE,
      display: 'Birth attendant title'
    }
  ])

  expect(fhir.entry[17].resource.id).toBe(
    '8f18a6ea-89d1-4b03-80b3-57509a7eebce-dh3283kdsoe'
  )
  expect(fhir.entry[17].resource.context.reference).toEqual(
    fhir.entry[12].fullUrl
  )
  expect(fhir.entry[17].resource.id).toBe(
    '8f18a6ea-89d1-4b03-80b3-57509a7eebce-dh3283kdsoe'
  )
  expect(fhir.entry[17].resource.valueQuantity.value).toBe(2)
  expect(fhir.entry[17].resource.context.reference).toEqual(
    fhir.entry[12].fullUrl
  )
  expect(fhir.entry[17].resource.code.coding).toEqual([
    {
      system: 'http://loinc.org',
      code: NUMBER_BORN_ALIVE_CODE,
      display: 'Number born alive to mother'
    }
  ])
  expect(fhir.entry[18].resource.id).toBe(
    '8f18a6ea-89d1-4b03-80b3-57509a7eebce-kdsa2324'
  )
  expect(fhir.entry[18].resource.valueQuantity.value).toBe(0)
  expect(fhir.entry[19].resource.context.reference).toEqual(
    fhir.entry[12].fullUrl
  )
  expect(fhir.entry[18].resource.code.coding).toEqual([
    {
      system: 'http://loinc.org',
      code: NUMBER_FOEATAL_DEATH_CODE,
      display: 'Number foetal deaths to mother'
    }
  ])
  expect(fhir.entry[19].resource.id).toBe(
    '8f18a6ea-89d1-4b03-80b3-57509a7eebce-dsa23324lsdafk'
  )
  expect(fhir.entry[19].resource.valueDateTime).toBe('2014-01-28')
  expect(fhir.entry[19].resource.context.reference).toEqual(
    fhir.entry[12].fullUrl
  )
  expect(fhir.entry[19].resource.code.coding).toEqual([
    {
      system: 'http://loinc.org',
      code: LAST_LIVE_BIRTH_CODE,
      display: 'Date last live birth'
    }
  ])
})

test('should update a task document as rejected', async () => {
  fetch.mockResponse(
    JSON.stringify({
      refUrl: '/ocrvs/3d3623fa-333d-11ed-a261-0242ac120002.png'
    })
  )
  const fhir: any = await updateFHIRTaskBundle(
    {
      fullUrl:
        'http://localhost:3447/fhir/Task/ba0412c6-5125-4447-bd32-fb5cf336ddbc' as URLReference,
      resource: {
        resourceType: 'Task',
        intent: 'order',
        status: 'ready',
        code: {
          coding: [{ system: 'http://opencrvs.org/specs/types', code: 'BIRTH' }]
        },
        extension: [
          {
            url: 'http://opencrvs.org/specs/extension/contact-person',
            valueString: 'MOTHER'
          },
          {
            url: 'http://opencrvs.org/specs/extension/regLastUser',
            valueReference: { reference: 'DUMMY' as ResourceIdentifier }
          }
        ],
        lastModified: '2018-11-28T15:13:57.492Z',
        note: [
          { text: '', time: '2018-11-28T15:13:57.492Z', authorString: 'DUMMY' }
        ],
        focus: {
          reference: 'Composition/df3fb104-4c2c-486f-97b3-edbeabcd4422'
        },
        identifier: [
          {
            system: 'http://opencrvs.org/specs/id/birth-tracking-id',
            value: 'B1mW7jA' as TrackingID
          }
        ],
        businessStatus: {
          coding: [
            { system: 'http://opencrvs.org/specs/reg-status', code: 'DECLARED' }
          ]
        },
        meta: {
          lastUpdated: '2018-11-29T14:50:34.127+00:00',
          versionId: '6bd9d08f-58e2-48f7-8279-ca08e64a3942'
        },
        id: 'ba0412c6-5125-4447-bd32-fb5cf336ddbc'
      }
    },
    'REJECTED',
    'Misspelling',
    'Child name was misspelled'
  )

  const rejectedReason = 'Misspelling'
  const rejectedText = 'Child name was misspelled'
  expect(fhir).toBeDefined()
  expect(fhir.entry[0].resource.reason.text).toEqual(rejectedReason)
  expect(fhir.entry[0].resource.statusReason.text).toEqual(rejectedText)
  expect(fhir.entry[0].resource.businessStatus.coding[0].code).toEqual(
    'REJECTED'
  )
})

test.only('creates task with contact other relationship', async () => {
  fetch.mockResponse(
    JSON.stringify({
      refUrl: '/ocrvs/3d3623fa-333d-11ed-a261-0242ac120002.png'
    })
  )
  const simpleFhir = await buildFHIRBundle(
    {
      registration: {
        _fhirID: '8f18a6ea-89d1-4b03-80b3-57509a7eebce',
        informantType: 'OTHER',
        otherInformantType: 'Friend',
        contactPhoneNumber: '01733333333',
        paperFormID: '12345678',
        trackingId: 'B123456',
        registrationNumber: '201923324512345671',
        inCompleteFields:
          'child/child-view-group/placeOfBirth,' +
          'mother/mother-view-group/iDType,' +
          'mother/mother-view-group/iD,' +
          'mother/mother-view-group/familyName,' +
          'mother/mother-view-group/familyNameEng',
        status: [
          {
            comments: [
              {
                comment: 'This is just a test data',
                createdAt: '2018-10-31T09:40:05+10:00'
              }
            ],
            timestamp: '2018-10-31T09:40:05+10:00',
            timeLoggedMS: 1234
          }
        ],
        attachments: [
          {
            _fhirID: '8f18a6ea-89d1-4b03-80b3-57509a7eebce11',
            contentType: 'image/jpeg',
            data: 'SampleData',
            status: 'final',
            originalFileName: 'original.jpg',
            systemFileName: 'system.jpg',
            type: 'NATIONAL_ID',
            createdAt: '2018-10-21'
          },
          {
            _fhirID: '8f18a6ea-89d1-4b03-80b3-57509a7eebce22',
            contentType: 'image/png',
            data: 'ExampleData',
            status: 'deleted',
            originalFileName: 'original.png',
            systemFileName: 'system.png',
            type: 'PASSPORT',
            createdAt: '2018-10-22',
            subject: 'MOTHER'
          }
        ],
        certificates: [
          {
            collector: {
              relationship: 'OTHER',
              affidavit: {
                contentType: 'image/jpg',
                data: 'ExampleData'
              },
              name: [{ firstNames: 'Doe', familyName: 'Jane', use: 'en' }],
              identifier: [{ id: '123456', type: 'PASSPORT' }]
            },
            hasShowedVerifiedDocument: true,
            payments: [
              {
                paymentId: '1234',
                type: 'MANUAL',
                total: 50,
                amount: 50,
                outcome: 'COMPLETED',
                date: '2018-10-22'
              }
            ],
            data: 'DUMMY-DATA'
          }
        ]
      }
    } as any,
    'BIRTH' as EVENT_TYPE,
    {} as any
  )

  expect(simpleFhir).toBeDefined()

  const taskResource = simpleFhir!.entry
    .map(({ resource }) => resource)
    .find(isTask)

  expect(taskResource).toBeDefined()
  expect(
    taskResource?.extension?.some((taskExtension) =>
      _.isEqual(taskExtension, {
        url: 'http://opencrvs.org/specs/extension/contact-person',
        valueString: 'OTHER'
      })
    )
  ).toBe(true)

  expect(
    taskResource?.extension?.some((taskExtension) =>
      _.isEqual(taskExtension, {
        url: 'http://opencrvs.org/specs/extension/contact-relationship',
        valueString: 'Friend'
      })
    )
  ).toBe(true)
})

describe('taskBundleWithExtension()', () => {
  it('should add the extension', () => {
    const bundle = taskBundleWithExtension({ resource: mockTask as any }, {
      url: 'mock-url',
      valueString: 'mock-value'
    } as any)
    const extension = bundle.entry[0].resource.extension as Extension[]
    expect(findExtension('mock-url' as any, extension)).toHaveProperty(
      'valueString',
      'mock-value'
    )
  })
})

describe('checkUserAssignment()', () => {
  const fetch = fetchMock as fetchMock.FetchMock
  const registerCertifyToken = jwt.sign(
    { scope: ['register', 'certify'] },
    readFileSync('./test/cert.key'),
    {
      subject: '121221',
      algorithm: 'RS256',
      issuer: 'opencrvs:auth-service',
      audience: 'opencrvs:gateway-user'
    }
  )
  const authHeaderRegCert: AuthHeader = {
    Authorization: `Bearer ${registerCertifyToken}`
  }
  it('should return true if user is assigned on task', async () => {
    fetch.mockResponseOnce(JSON.stringify({ userId: '121221' }))
    const bundle = await checkUserAssignment(
      '5d027bc403b93b17526323f6',
      authHeaderRegCert
    )
    expect(bundle).toBe(true)
  })

  it('should return false if user is not assigned on task', async () => {
    fetch.mockResponseOnce(JSON.stringify({ userId: '123456' }))
    const bundle = await checkUserAssignment(
      '5d027bc403b93b17526323f6',
      authHeaderRegCert
    )
    expect(bundle).toBe(false)
  })

  it('should return false if authHeader has no Authorization', async () => {
    fetch.mockResponse(JSON.stringify({ userId: '121221' }))
    //@ts-ignore
    delete authHeaderRegCert.Authorization
    const bundle = await checkUserAssignment(
      '5d027bc403b93b17526323f6',
      authHeaderRegCert
    )
    expect(bundle).toBe(false)
  })
})
