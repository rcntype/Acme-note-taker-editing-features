const API = 'https://acme-users-api-rev.herokuapp.com/api';

      const fetchUser = async ()=> {
        const storage = window.localStorage;
        const userId = storage.getItem('userId'); 
        if(userId){
          try {
            return (await axios.get(`${API}/users/detail/${userId}`)).data;
          }
          catch(ex){
            storage.removeItem('userId');
            return fetchUser();
          }
        }
        const user = (await axios.get(`${API}/users/random`)).data;
        storage.setItem('userId', user.id);
        return  user;
      };

      const { render } = ReactDOM;
      const { Component } = React;
      const { HashRouter, Route, Link, Switch, Redirect } = ReactRouterDOM;




      


      class Edited extends Component {
          constructor({notes, props}) {
              super()
              this.state = {
                  text: ''
              }
            this.update = this.update.bind(this)
          }
        //   async update(note){
        //     console.log(note)
            
        //     // const updated = (await axios.put(`${API}/users/${this.state.user.id}/notes/${note.id}`, { archived: note.archived, text: note.text })).data;
        //     // // this.setState({ note : this.state.notes.map( note => note.id === updated.id ? updated : note)});
        //   }

          componentDidMount(){
            const note = this.props.notes.find(note => note.id === this.props.match.params.id)
            this.setState({text: note.text})
          }
          update(){
              this.props.update({text: this.state.text, id: this.props.id})
          }

          render(){
              const {text} = this.state
              const {props, update} = this
              
              if(!text){
                  return (
                    <Redirect to='/notes' />
                  )
              }
             
              return (
                <form onSubmit = { ev => ev.preventDefault() }>
                  <input value={ text} placeholder={text} onChange={(ev) => this.setState({text: ev.target.value})}/>
                  <button onClick={() =>  {update({note, archived: note.archived, text: text})}}>Update</button>
                </form>
              )

          }
      }

      const Notes = ({ notes, archived, update, destroy })=> {
        return (
          
                <ul>
                    {
                    notes.filter(note => note.archived === archived).map( note => <li 
                        key={ note.id }><Link to={`/notes/${note.id}`}>{ note.text}</Link>
                        
                        <br />
                        <button onClick={()=> { update({...note, archived: !note.archived})}}>{ archived ? 'unarchive': 'archive' }</button>
                        <button onClick={ ()=> destroy(note)}>destroy</button>
                        </li>)
                    }
                </ul>
               

           
        );

      };

      const Nav = ({ path, notes })=> {
        const archived = notes.filter( note => note.archived);
        return (
          <nav>
            <Link to='/notes' className={ path === '/notes' ? 'selected': ''}>Notes ({ notes.length - archived.length })</Link>
            <Link to='/archived' className={ path === '/archived' ? 'selected': ''}>Archived ({ archived.length })</Link>
            <Link to='/notes/create' className={ path === '/notes/create' ? 'selected': ''}>Create</Link>
          </nav>
        );
      };

      class Create extends Component{
        constructor(){
          super(); 
          this.state = {
            text: '',
            error: ''
          };
          this.create = this.create.bind(this);
        }
        create(){
          this.props.create({ text: this.state.text })
            .then(()=> this.props.history.push('/notes'))
            .catch( ex => this.setState({ error: ex.response.data.message }));
        }
        render(){
          const { text, error } = this.state;
          const { create } = this;
          return (
            <form onSubmit = { ev => ev.preventDefault() }>
              { !!error && <div className='error'>{error }</div>  }
              <input value={ text } placeholder='create new note' onChange={ (ev)=> this.setState({ text: ev.target.value }) }/>
              <button disabled={ !text } onClick={ create }>Create</button>
            </form>
          );
        }
      }

      class App extends Component{
        constructor(){
          super();
          this.state = {
            user: {},
            notes: []
          };
          this.update = this.update.bind(this);
          this.create = this.create.bind(this);
          this.destroy = this.destroy.bind(this);
        }
        async destroy(note){
          await axios.delete(`${API}/users/${this.state.user.id}/notes/${note.id}`);
          this.setState({ notes : this.state.notes.filter( _note => _note.id !== note.id)});
        }
        async componentDidMount(){
          const user = await fetchUser();
          const notes = (await axios.get(`${API}/users/${ user.id }/notes`)).data;
          this.setState({ notes, user });
        }
        async update(note){
          const updated = (await axios.put(`${API}/users/${this.state.user.id}/notes/${note.id}`, { archived: note.archived, text: note.text })).data;
          this.setState({ notes : this.state.notes.map( note => note.id === updated.id ? updated : note)});
        }
        async create(note){
          const created = (await axios.post(`${API}/users/${this.state.user.id}/notes`, note)).data;
          const notes = [...this.state.notes, created ];
          this.setState({ notes }); 
        }
        render(){
          const { notes, user } = this.state;
          const { update, create, destroy } = this;
          return (
            <HashRouter>
              <Route render={ ({ location } )=> <Nav path={ location.pathname } notes={ notes } />} />
              <h1>Acme Note--taker for { user.id ? user.fullName : '' }</h1>
              <Switch>
                <Route exact path='/notes' render={ ()=> <Notes destroy={ destroy} archived={ false } notes={ notes} update={ update }/> } />
                <Route exact path='/notes/create' render={ ({ history })=> <Create history={ history } create={ create } notes={ notes } /> } />
                <Route path='/notes/:id' render={ (props)=> <Edited {...props} notes={ notes} update={ update }/> } />
                <Route path='/archived' render={ ()=> <Notes destroy={ destroy } archived={ true } notes={ notes} update={ update }/> } />
                <Redirect to='/notes' />
              </Switch>
            </HashRouter>

          );
        }

      }
      const root = document.querySelector('#root');
      render(<App />, root);