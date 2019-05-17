const {buildSchema} = require('graphql');

module.exports = buildSchema(`

    type Post {
        _id: ID!
        title: String!
        content: String!
        imageUrl: String!
        creator: User
        createdAt: String!
        updatedAt: String!
    }

    type User {
        _id: ID!
        name: String!
        email: String!
        password: String!
        status: String!
        posts: [Post!]!
    }

    input  userInputData {
        email: String!
        name: String!
        password: String!
    }

    type postData {
        posts: [posts!]!
        totaltPosts: Int!
    }

    input inputPostData {
        title: String!
        content: String!
        imageUrl: String!
    }

    type RootMutation {
        createUser(userInput: userInputData): User!
        createPost(postInput: inputPostData): Post!
    }

    type authData {
        token: String!
        userId: String!
    }

    type RootQuery {
        login(email: String!, password: String!): authData!
        posts(page: Int!): postData
        post(id: ID!): Post
    }

    schema {
        query: RootQuery
        mutation: RootMutation
    }
`);