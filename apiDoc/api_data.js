define({ "api": [
  {
    "type": "post",
    "url": "/authentication/login",
    "title": "Login",
    "name": "Login",
    "description": "<p>user login</p> ",
    "group": "Authentication",
    "version": "1.0.0",
    "permission": [
      {
        "name": "unauthorized"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": true,
            "field": "email",
            "description": "<p>email address to send new pw</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": true,
            "field": "password",
            "description": "<p>account password to set new email, password</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": true,
            "field": "platform",
            "description": "<p>logged in from ios|android|web</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "request body",
          "content": "{ \"login\": \"bengtler@gmail.com\",\n  \"password\": \"123456\",\n  \"platform\": \"web\" }",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "<p>Object</p> ",
            "optional": false,
            "field": "authentication",
            "description": "<p>the authentication with tokens and user.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"refreshToken\": \"refreshtoken\",\n  \"accessToken\": \"token\",\n  \"_id\": \"507f191e810c19729de860ea\",\n  \"user\": { ... } // user object\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "optional": false,
            "field": "InternalServerError",
            "description": "<p>An error while processing mongoDB query occurs.</p> "
          }
        ],
        "Error 400": [
          {
            "group": "Error 400",
            "optional": false,
            "field": "MissingParameter",
            "description": "<p>a parameter is missing</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "InvalidStructure",
            "description": "<p>structure of a parameter is invalid</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "WrongDatatype",
            "description": "<p>type of parameter is invalid</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "InvalidPassword",
            "description": "<p>old password is wrong</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "InvalidLogin",
            "description": "<p>username/email and password combination is wrong</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "AlreadyLoggedIn",
            "description": "<p>authorization header is set with valid user</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"MONGODB ERROR OBJECT\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"missing_parameter\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"invalid_structure\",\n  \"param\": \"email\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"wrong_type\",\n  \"param\": \"email\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"invalid_password\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"invalid_login_password_combination\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"already_logged_in\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "endpoints/authentication.js",
    "groupTitle": "Authentication",
    "sampleRequest": [
      {
        "url": "localhost:8000/api/v1/authentication/login"
      }
    ]
  },
  {
    "type": "get",
    "url": "/authentication/logout",
    "title": "Logout",
    "name": "Logout",
    "description": "<p>removes current authentication --&gt; logout</p> ",
    "group": "Authentication",
    "version": "1.0.0",
    "permission": [
      {
        "name": "User, Admin"
      }
    ],
    "header": {
      "examples": [
        {
          "title": "Authorization-Header-Example:",
          "content": "{ \"Authorization\": \"Bearer mF_9.B5f-4.1JqM\" }",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "optional": false,
            "field": "InternalServerError",
            "description": "<p>An error while processing mongoDB query occurs.</p> "
          }
        ],
        "Error 403": [
          {
            "group": "Error 403",
            "optional": false,
            "field": "UserNotFound",
            "description": "<p>there is no user for the accesstoken</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"MONGODB ERROR OBJECT\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 403 Not Found",
          "type": "json"
        }
      ]
    },
    "filename": "endpoints/authentication.js",
    "groupTitle": "Authentication",
    "sampleRequest": [
      {
        "url": "localhost:8000/api/v1/authentication/logout"
      }
    ]
  },
  {
    "type": "post",
    "url": "/authentication/refresh",
    "title": "Refresh",
    "name": "RefreshLogin",
    "description": "<p>generated new access- and refreshtoken pair</p> ",
    "group": "Authentication",
    "version": "1.0.0",
    "permission": [
      {
        "name": "unauthorized"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "accessToken",
            "description": "<p>current access token</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "refreshToken",
            "description": "<p>the refresh token</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "request body",
          "content": "{ \"accessToken\": \"adsfasdfdasfdasf\",\n  \"refreshToken\": \"asdfdasfdasf\" }",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "<p>Object</p> ",
            "optional": false,
            "field": "authentication",
            "description": "<p>the authentication with tokens and user.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"refreshToken\": \"refreshtoken\",\n  \"accessToken\": \"token\",\n  \"_id\": \"507f191e810c19729de860ea\",\n  \"user\": { ... } // user object\n}",
          "type": "json"
        }
      ]
    },
    "header": {
      "examples": [
        {
          "title": "Authorization-Header-Example:",
          "content": "{ \"Authorization\": \"Bearer mF_9.B5f-4.1JqM\" }",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "optional": false,
            "field": "InternalServerError",
            "description": "<p>An error while processing mongoDB query occurs.</p> "
          }
        ],
        "Error 400": [
          {
            "group": "Error 400",
            "optional": false,
            "field": "InvalidRefresh",
            "description": "<p>refreshtoken is incorrect</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "InvalidUser",
            "description": "<p>there is no user for authorization</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"MONGODB ERROR OBJECT\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"invalid_refresh_token\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"user_not_found\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "endpoints/authentication.js",
    "groupTitle": "Authentication",
    "sampleRequest": [
      {
        "url": "localhost:8000/api/v1/authentication/refresh"
      }
    ]
  },
  {
    "type": "get",
    "url": "/user/check",
    "title": "Check User",
    "name": "CheckUser",
    "description": "<p>checks if a user with email or username exists</p> ",
    "group": "User",
    "version": "1.0.0",
    "permission": [
      {
        "name": "everyone"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "email",
            "description": "<p>email address to check</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "username",
            "description": "<p>user name to check</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "[email]",
          "content": "?email=bengtler@gmail.com",
          "type": "string"
        },
        {
          "title": "[username]",
          "content": "?username=killercodemonkey",
          "type": "string"
        }
      ]
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": true,
            "field": "Authorization",
            "description": "<p>Set TOKENTYPE ACCESSTOKEN for possible authorization</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Authorization-Header-Example:",
          "content": "{ \"Authorization\": \"Bearer mF_9.B5f-4.1JqM\" }",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "<p>Boolean</p> ",
            "optional": false,
            "field": "exists",
            "description": "<p>if username or email exists</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"exists\": true\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "optional": false,
            "field": "InternalServerError",
            "description": "<p>An error while processing mongoDB query occurs.</p> "
          }
        ],
        "Error 400": [
          {
            "group": "Error 400",
            "optional": false,
            "field": "MissingParameter",
            "description": "<p>a required parameter is missing</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "InvalidStructure",
            "description": "<p>parameter value is invalid.</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "WrongDatatype",
            "description": "<p>paramete has wrong type</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"MONGODB ERROR OBJECT\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"missing_parameter\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"invalid_structure\",\n  \"param\": \"email\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"wrong_type\",\n  \"param\": \"email\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "endpoints/user.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "localhost:8000/api/v1/user/check"
      }
    ]
  },
  {
    "type": "get",
    "url": "/user/account",
    "title": "Get Account",
    "name": "GetAccount",
    "description": "<p>Gets the current logged in user</p> ",
    "group": "User",
    "version": "1.0.0",
    "permission": [
      {
        "name": "authorized User"
      }
    ],
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Set TOKENTYPE ACCESSTOKEN for possible authorization</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Authorization-Header-Example:",
          "content": "{ \"Authorization\": \"Bearer mF_9.B5f-4.1JqM\" }",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "firstName",
            "description": "<p>firstname of the User.</p> "
          },
          {
            "group": "Success 200",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "lastName",
            "description": "<p>lastname of the User.</p> "
          },
          {
            "group": "Success 200",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "username",
            "description": "<p>username of the User.</p> "
          },
          {
            "group": "Success 200",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "normalizedUsername",
            "description": "<p>username in lowercase.</p> "
          },
          {
            "group": "Success 200",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "email",
            "description": "<p>email address of the User.</p> "
          },
          {
            "group": "Success 200",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "creationDate",
            "description": "<p>registration date of the User.</p> "
          },
          {
            "group": "Success 200",
            "type": "<p>String[]</p> ",
            "optional": false,
            "field": "permissions",
            "description": "<p>the permissions/roles of the user.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"username\": \"killercodemonkey\",\n  \"_id\": \"507f191e810c19729de860ea\",\n  \"email\": \"bengtler@gmail.com\",\n  \"permissions\": [\n     'user',\n     'admin'\n  ]\n}",
          "type": "json"
        }
      ]
    },
    "filename": "endpoints/user.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "localhost:8000/api/v1/user/account"
      }
    ]
  },
  {
    "type": "get",
    "url": "/user/:id",
    "title": "Get User",
    "name": "GetUser",
    "description": "<p>Gets a user (no admins!)</p> ",
    "group": "User",
    "version": "1.0.0",
    "permission": [
      {
        "name": "everyone"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "id",
            "description": "<p>objectid of the user</p> "
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": true,
            "field": "Authorization",
            "description": "<p>Set TOKENTYPE ACCESSTOKEN for possible authorization</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Authorization-Header-Example:",
          "content": "{ \"Authorization\": \"Bearer mF_9.B5f-4.1JqM\" }",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "username",
            "description": "<p>username of the User.</p> "
          },
          {
            "group": "Success 200",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "email",
            "description": "<p>email address of the User.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"username\": \"killercodemonkey\",\n  \"_id\": \"507f191e810c19729de860ea\",\n  \"email\": \"bengtler@gmail.com\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 403": [
          {
            "group": "Error 403",
            "optional": false,
            "field": "Forbidden",
            "description": "<p>Trying to get admin user.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 403 Forbidden\n{\n  \"error\": \"permission_denied\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "endpoints/user.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "localhost:8000/api/v1/user/:id"
      }
    ]
  },
  {
    "type": "get",
    "url": "/user",
    "title": "Get User list",
    "name": "GetUsers",
    "description": "<p>Gets the list of all users exclude self</p> ",
    "group": "User",
    "version": "1.0.0",
    "permission": [
      {
        "name": "everyone"
      }
    ],
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": true,
            "field": "Authorization",
            "description": "<p>Set TOKENTYPE ACCESSTOKEN for possible authorization</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Authorization-Header-Example:",
          "content": "{ \"Authorization\": \"Bearer mF_9.B5f-4.1JqM\" }",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "<p>Object[]</p> ",
            "optional": false,
            "field": "UserList",
            "description": "<p>list of user objects.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n[{\n  \"username\": \"killercodemonkey\",\n  \"_id\": \"507f191e810c19729de860ea\"\n}]",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "optional": false,
            "field": "InternalServerError",
            "description": "<p>An error while processing mongoDB query occurs.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"MONGODB ERROR OBJECT\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "endpoints/user.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "localhost:8000/api/v1/user"
      }
    ]
  },
  {
    "type": "post",
    "url": "/user",
    "title": "Register User",
    "name": "Register",
    "description": "<p>Register a new User</p> ",
    "group": "User",
    "version": "1.0.0",
    "permission": [
      {
        "name": "unauthorized"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "email",
            "description": "<p>email address to send new pw</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "password",
            "description": "<p>account password</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": true,
            "field": "firstName",
            "description": "<p>first name of user</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": true,
            "field": "lastName",
            "description": "<p>last name of user</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "request body",
          "content": "{ \"email\": \"bengtler@gmail.com\",\n  \"password\": \"123456\",\n  \"firstName\": \"Bengt\",\n  \"lastName\": \"Weiße\" }",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "<p>Object</p> ",
            "optional": false,
            "field": "user",
            "description": "<p>the user object.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"firstName\": \"Bengt\",\n  \"lastName\": \"Weiße\",\n  \"_id\": \"507f191e810c19729de860ea\",\n  \"email\": \"bengtler@gmail.com\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 5xx": [
          {
            "group": "Error 5xx",
            "optional": false,
            "field": "InternalServerError",
            "description": "<p>An error while processing mongoDB query occurs.</p> "
          }
        ],
        "Error 400": [
          {
            "group": "Error 400",
            "optional": false,
            "field": "MissingParameter",
            "description": "<p>a parameter is missing</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "InvalidStructure",
            "description": "<p>structure of a parameter is invalid</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "WrongDatatype",
            "description": "<p>type of parameter is invalid</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "AlreadyLoggedIn",
            "description": "<p>valid authorization header is set</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "UserExists",
            "description": "<p>a user with the given email already exists</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"MONGODB ERROR OBJECT\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"missing_parameter\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"invalid_structure\",\n  \"param\": \"email\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"wrong_type\",\n  \"param\": \"email\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"user_already_loggedin\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"email_exists\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "endpoints/user.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "localhost:8000/api/v1/user"
      }
    ]
  },
  {
    "type": "delete",
    "url": "/user/:id",
    "title": "Remove user",
    "name": "RemoveUser",
    "description": "<p>removes a user as admin</p> ",
    "group": "User",
    "version": "1.0.0",
    "permission": [
      {
        "name": "admin"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "id",
            "description": "<p>objectid of the user</p> "
          }
        ]
      }
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Set TOKENTYPE ACCESSTOKEN for possible authorization</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Authorization-Header-Example:",
          "content": "{ \"Authorization\": \"Bearer mF_9.B5f-4.1JqM\" }",
          "type": "json"
        }
      ]
    },
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 500": [
          {
            "group": "Error 500",
            "optional": false,
            "field": "InternalServerError",
            "description": "<p>An error while processing mongoDB query occurs.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"MONGODB ERROR OBJECT\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "endpoints/user.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "localhost:8000/api/v1/user/:id"
      }
    ]
  },
  {
    "type": "put",
    "url": "/user/sendPassword",
    "title": "Send new password",
    "name": "SendPassword",
    "description": "<p>sends password for email</p> ",
    "group": "User",
    "version": "1.0.0",
    "permission": [
      {
        "name": "unauthorized"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": false,
            "field": "email",
            "description": "<p>email address to send new pw</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "request body",
          "content": "{ \"email\": \"bengtler@gmail.com\" }",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "<p>Object</p> ",
            "optional": false,
            "field": "user",
            "description": "<p>the user object.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"username\": \"killercodemonkey\",\n  \"_id\": \"507f191e810c19729de860ea\",\n  \"email\": \"bengtler@gmail.com\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 5xx": [
          {
            "group": "Error 5xx",
            "optional": false,
            "field": "InternalServerError",
            "description": "<p>An error while processing mongoDB query occurs.</p> "
          }
        ],
        "Error 400": [
          {
            "group": "Error 400",
            "optional": false,
            "field": "MissingParameter",
            "description": "<p>a parameter is missing</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "InvalidStructure",
            "description": "<p>structure of a parameter is invalid</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "WrongDatatype",
            "description": "<p>type of parameter is invalid</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "AlreadyLoggedIn",
            "description": "<p>valid authorization header is set</p> "
          }
        ],
        "Error 404": [
          {
            "group": "Error 404",
            "optional": false,
            "field": "NotFound",
            "description": "<p>User not found</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"MONGODB ERROR OBJECT\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"missing_parameter\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"invalid_structure\",\n  \"param\": \"email\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"wrong_type\",\n  \"param\": \"email\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"user_already_loggedin\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 404 Not Found\n{\n  \"error\": \"user_not_found\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "endpoints/user.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "localhost:8000/api/v1/user/sendPassword"
      }
    ]
  },
  {
    "type": "put",
    "url": "/user/account",
    "title": "Update User",
    "name": "UpdateAccount",
    "description": "<p>Update current loggedin user</p> ",
    "group": "User",
    "version": "1.0.0",
    "permission": [
      {
        "name": "User"
      }
    ],
    "parameter": {
      "fields": {
        "Parameter": [
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": true,
            "field": "email",
            "description": "<p>email address to send new pw</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": true,
            "field": "password",
            "description": "<p>account password to set new email, password</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": true,
            "field": "newPassword",
            "description": "<p>new account password</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": true,
            "field": "firstName",
            "description": "<p>first name of user</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": true,
            "field": "lastName",
            "description": "<p>last name of user</p> "
          },
          {
            "group": "Parameter",
            "type": "<p>String</p> ",
            "optional": true,
            "field": "username",
            "description": "<p>set unique username</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "request body",
          "content": "{ \"email\": \"bengtler@gmail.com\",\n  \"username\": \"killercodemonkey\",\n  \"password\": \"123456\",\n  \"newPassword\": \"123457\"\n  \"firstName\": \"Bengt\",\n  \"lastName\": \"Weiße\" }",
          "type": "json"
        }
      ]
    },
    "header": {
      "fields": {
        "Header": [
          {
            "group": "Header",
            "type": "String",
            "optional": false,
            "field": "Authorization",
            "description": "<p>Set TOKENTYPE ACCESSTOKEN for possible authorization</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Authorization-Header-Example:",
          "content": "{ \"Authorization\": \"Bearer mF_9.B5f-4.1JqM\" }",
          "type": "json"
        }
      ]
    },
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "<p>Object</p> ",
            "optional": false,
            "field": "user",
            "description": "<p>the user object.</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n{\n  \"firstName\": \"Bengt\",\n  \"lastName\": \"Weiße\",\n  \"username\": \"killercodemonkey\",\n  \"_id\": \"507f191e810c19729de860ea\",\n  \"email\": \"bengtler@gmail.com\"\n}",
          "type": "json"
        }
      ]
    },
    "error": {
      "fields": {
        "Error 5xx": [
          {
            "group": "Error 5xx",
            "optional": false,
            "field": "InternalServerError",
            "description": "<p>An error while processing mongoDB query occurs.</p> "
          }
        ],
        "Error 400": [
          {
            "group": "Error 400",
            "optional": false,
            "field": "MissingParameter",
            "description": "<p>a parameter is missing</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "InvalidStructure",
            "description": "<p>structure of a parameter is invalid</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "WrongDatatype",
            "description": "<p>type of parameter is invalid</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "InvalidPassword",
            "description": "<p>old password is wrong</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "EmailExists",
            "description": "<p>a user with the given email already exists</p> "
          },
          {
            "group": "Error 400",
            "optional": false,
            "field": "UsernameExists",
            "description": "<p>a user with the given email already exists</p> "
          }
        ]
      },
      "examples": [
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 500 Internal Server Error\n{\n  \"error\": \"MONGODB ERROR OBJECT\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"missing_parameter\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"invalid_structure\",\n  \"param\": \"email\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"wrong_type\",\n  \"param\": \"email\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Bad Request\n{\n  \"error\": \"invalid_password\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Not Found\n{\n  \"error\": \"email_exists\"\n}",
          "type": "json"
        },
        {
          "title": "Error-Response:",
          "content": "HTTP/1.1 400 Not Found\n{\n  \"error\": \"username_exists\"\n}",
          "type": "json"
        }
      ]
    },
    "filename": "endpoints/user.js",
    "groupTitle": "User",
    "sampleRequest": [
      {
        "url": "localhost:8000/api/v1/user/account"
      }
    ]
  }
] });