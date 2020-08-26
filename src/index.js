import React from "react";
import { render } from "react-dom";
import { ApolloClient, InMemoryCache, gql } from "@apollo/client";
import { createMachine, assign } from "xstate";
import { useMachine } from "@xstate/react";

const client = new ApolloClient({
  uri: "https://swapi.graph.cool",
  cache: new InMemoryCache()
});

// Returns a promise. That's all you need!
const getFilms = () =>
  client.query({
    query: gql`
      {
        allFilms {
          title
          episodeId
          director
        }
      }
    `
  });

const filmsMachine = createMachine({
  initial: "loading",
  context: {
    data: null
  },
  states: {
    loading: {
      invoke: {
        src: getFilms,
        onError: "error",
        onDone: {
          target: "success",
          actions: assign({
            data: (_, event) => event.data.data
          })
        }
      }
    },
    success: {
      on: {
        REFETCH: "loading"
      }
    },
    error: {
      on: {
        REFETCH: "loading"
      }
    }
  }
});

function Films() {
  const [state, send] = useMachine(filmsMachine, {
    services: {
      getFilms
    }
  });
  const { data } = state.context;

  return (
    <div>
      {state.matches("loading") && <p>Loading...</p>}
      {state.matches("error") && <p>Error :(</p>}
      {state.matches("success") && (
        <ul>
          {data.allFilms.map((film) => {
            return <li key={film.episodeId}>{film.title}</li>;
          })}
        </ul>
      )}
      <button onClick={() => send("REFETCH")}>Refetch</button>
      <small> (might be super fast because of cache)</small>
    </div>
  );
}

function App() {
  return (
    <div>
      <h2>Star Wars Films</h2>
      <Films />
    </div>
  );
}

render(<App />, document.getElementById("root"));
