import { makeSqlSchema, getSchemaDirectives } from '../src'

test('main test', () => {
  makeSqlSchema({
    typeDefs: '',
    schemaDirectives: {
      ...getSchemaDirectives(),
    },
    outputFilepath: '',
  })
})
