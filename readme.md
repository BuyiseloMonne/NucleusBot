pip install openai
openai api key set <your_openai_api_key>

openai tools fine_tunes.prepare_data -f data.jsonl
openai api fine_tunes.create -t <path_to_prepared_data_file> -m <base_model>
openai api fine_tunes.get -i <fine_tune_id>
