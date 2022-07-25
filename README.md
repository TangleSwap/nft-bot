# Soonaverse-NFT-Bot

This bot grants members of a discord guild unique roles depending on
the type of nfts they hold from a possible range of collections.

Discord users must provide their `DiscordTag` into their Soonaverse
profile that is holding their NFTs.

## Contents

- [Soonaverse-NFT-Bot](#soonaverse-nft-bot)
  - [Contents](#contents)
  - [Project Structure](#project-structure)
  - [Usage](#usage)
    - [Discord Privileges](#discord-privileges)
    - [Deploying to AWS](#deploying-to-aws)
  - [Credits and Thanks](#credits-and-thanks)
  - [License](#license)

## Project Structure

```bash
.
├── .gitignore
├── LICENSE
├── README.md
├── package.json
├── src
│   ├── config-example.ts
│   ├── main.ts
│   ├── nftRoleManager.ts
│   └── treasuryManager.ts
└── tsconfig.json

1 directory, 9 files

```

## Usage

### Discord Privileges

- Manage Roles
- The botowner needs to be 2FA enabled if the server admin is.

### Deploying to AWS

Currently the Bot is deployed to AWS inside a lambda function, scheduled
to run once per hour. As the functionality for the bot is branched out
the frequency of this will increase as well as built in functionality to
trigger parts of the bot from API endpoints.

The [Serverless Application Model](https://github.com/aws/serverless-application-model) Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To use the SAM CLI, you need the following tools.

- SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- Node.js - [Install Node.js 16](https://nodejs.org/en/), including the NPM package management tool.
- Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

To build and deploy, run the following in your shell:

```bash
sam build --beta-features
# to test the bot locally, NOTE: if credentials are provided in the config file this will run the bot
sam local invoke
# to also deploy after configuring aws credentials
sam deploy --guided
```

## Credits and Thanks

Heavy inspiration taken from `HerrSkull`:
[Soonaverse-NFT-Bot](https://github.com/HerrSkull/Soonaverse-NFT-Bot>)

The TangleSwap Team for their ideas and dutiful testing services.

The community for utilising this service.

## License

MIT
