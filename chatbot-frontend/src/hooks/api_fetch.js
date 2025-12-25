import{ useState, useEffect} from 'react';

function useFetch(url){
    const [data, setData] = useState(null);
    const [loading,setLoading] = useState(true);
    const [error,setError] = useState(null);

    useEffect (() =>{
        const fetchData = async() => {
        const response = await fetch(url);
        try{
             if(!response.ok){
            throw new Error('Error reaching from the local apeii server');
        }
        const result= await response.json();
        setData(result);
        }
       
        catch(error) {setError(error);} 
        finally{ setLoading(false);}
    };

    fetchData();},[url]);

    return {data, loading, error};
    
    }

export default useFetch; 

