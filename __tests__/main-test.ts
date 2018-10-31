import {
  makeSqlSchema,
  getSchemaDirectives,
  directiveDeclaration,
} from '../src'

test('main test', () => {
  const typeDefs = `
    ${directiveDeclaration}
  
    type User @sql(unicode: true) {
      userId: String @sql(type: "BINARY(16)", primary: true)
      databaseOnlyField: Int @sql(hide: true)
      graphqlOnlyField: String
      uniqueColumn: Int @sql(unique: true)
      posts: [Post]
    }
  
    type Post @sql(unicode: true) {
      postId: Int @sql(primary: true, auto: true)
      userId: String @sql(type: "BINARY(16)", index: true)
      content: String @sql(length: 240, unicode: true, nullable: true)
      likes: Int @sql
      dateCreated: String @sql(default: "CURRENT_TIMESTAMP")
    }
  `

  const directives = getSchemaDirectives()
  makeSqlSchema({
    typeDefs,
    schemaDirectives: directives,
    outputFilepath: '',
  })
})

test('error no primary index', () => {
  const typeDefs = `
    ${directiveDeclaration}
  
    type User @sql(unicode: true) {
      userId: String @sql(type: "BINARY(16)")
    }
  `

  const directives = getSchemaDirectives()
  expect(() => {
    makeSqlSchema({
      typeDefs,
      schemaDirectives: directives,
      outputFilepath: '',
    })
  }).toThrow()
})

test('error multiple primary index', () => {
  const typeDefs = `
    ${directiveDeclaration}
  
    type User @sql(unicode: true) {
      userId: String @sql(primary: true)
      postId: String @sql(primary: true)
    }
  `

  const directives = getSchemaDirectives()
  expect(() => {
    makeSqlSchema({
      typeDefs,
      schemaDirectives: directives,
      outputFilepath: '',
    })
  }).toThrow()
})
