FROM rust:1-slim-buster AS base

ENV USER=root

WORKDIR /code
RUN cargo init
COPY Cargo.toml /code/Cargo.toml
RUN cargo fetch

COPY src /code/src
COPY public /code/public
COPY img /code/img

CMD [ "cargo", "test", "--offline" ]

FROM base AS builder

RUN cargo build --release --offline

FROM rust:1-slim-buster

COPY --from=builder /code/target/release/website_project /usr/bin/web/website_project
COPY --from=builder /code/public /usr/bin/web/public
COPY --from=builder /code/img /usr/bin/web/img

WORKDIR /usr/bin/web

ENTRYPOINT [ "/usr/bin/web/website_project" ]