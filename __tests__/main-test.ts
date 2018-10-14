import {
  makeSqlSchema,
  getSchemaDirectives,
  directiveDeclaration,
} from '../src'

const typeDefs = `
  ${directiveDeclaration}

  type User @sql(options: "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci") {
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

test('main test', () => {
  const directives = getSchemaDirectives()
  makeSqlSchema({
    typeDefs,
    schemaDirectives: directives,
    outputFilepath: '',
  })
})
