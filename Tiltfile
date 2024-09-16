
local_resource(
    "build",
    cmd="npm run build",
    deps=["app"],
)

local_resource("serve",
    serve_cmd="npm start",
    deps=["build"],
)