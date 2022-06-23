**Prerequisites**
-   [Node.js](https://nodejs.org/) 12
-   [Yarn package manager](https://yarnpkg.com/) (recent/latest version)
-   [Rust toolchain](https://rustup.rs/) (rustc 1.41.0)
-   [wasm-pack](https://rustwasm.github.io/wasm-pack/) (recent/latest version)
-   [Docker](https://www.docker.com/) to build docker images

1. Clone the respository
2. Install dependencies

```sh-session
$ yarn install
```

3. Build

```sh-session
$ yarn build
```

4. Run blockchainETL

```sh-session
$ ./bin/run --help
```

### Build blockchainETL docker image

```sh-session
$ docker build -t blockchainETL .
```

## Run tests

There are several unit tests in this repo. In order for CI checks to pass, all tests need to complete successfully.

To execute them, simply run:

```sh-session
$ yarn test
```

You can also execute tests in watch mode, which will automatically re-run tests as you make changes:

```sh-session
$ yarn test --watch
```
