// Copyright IBM Corp. 2017,2018. All Rights Reserved.
// Node module: openapi-to-graphql
// This file is licensed under the MIT License.
// License text available at https://opensource.org/licenses/MIT

'use strict'

/* globals beforeAll, test, expect */

import { graphql } from 'graphql'

import * as openAPIToGraphQL from '../lib/index'
import { startServer, stopServer } from './example_api2_server'

const oas = require('./fixtures/example_oas2.json')
const PORT = 3004
// Update PORT for this test case:
oas.servers[0].variables.port.default = String(PORT)

let createdSchema

/**
 * hooks
 */

/**
 * Set up the schema first and run example API server
 */
beforeAll(() => {
  return Promise.all([
    openAPIToGraphQL
      .createGraphQLSchema(oas, { operationIdFieldNames: true, hooks: {
        beforeResponseResolve: (_, __, ___, info) => {
          if (info.fieldName === 'getUser') {
            info.body.name = 'getUser_haschange'
          }
          if (info.fieldName === 'user') {
            info.body.name = 'user_haschange'
          }
        }
      } })
      .then(({ schema, report }) => {
        createdSchema = schema
      }),
    startServer(PORT)
  ])
})

/**
 * Shut down API server
 */
afterAll(() => {
  return stopServer()
})

test('hooks', () => {
  const query = `query {
    getUser {
      name
    }
    user {
      name
    }
  }`
  return graphql(createdSchema, query).then(result => {
    expect(result).toEqual({
      data: {
        getUser: {
          name: 'getUser_haschange'
        },
        user: {
          name: 'user_haschange'
        }
      }
    })
  })
})
